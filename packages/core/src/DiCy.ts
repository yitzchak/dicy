import * as _ from 'lodash'
import * as path from 'path'
import * as readdir from 'readdir-enhanced'

import State from './State'
import StateConsumer from './StateConsumer'
import File from './File'
import Rule from './Rule'

import { Action, Command, Option, Phase, RuleInfo } from './types'

const VALID_COMMAND_PATTERN = /^(build|clean|graph|load|log|save|scrub)$/

export default class DiCy extends StateConsumer {
  private consumers: Map<string | null, StateConsumer> = new Map<string | null, StateConsumer>()

  static async create (filePath: string, options: object = {}) {
    const schema = await DiCy.getOptionDefinitions()
    const state = new State(filePath, schema)
    const builder = new DiCy(state, state.getJobOptions())

    await builder.initialize()
    await builder.setInstanceOptions(options)

    builder.assignOptions(options)

    return builder
  }

  static async getOptionDefinitions (): Promise<Option[]> {
    const filePath = path.resolve(__dirname, '..', 'resources', 'option-schema.yaml')
    const schema: any = await File.readYaml(filePath, true)
    const options = []
    for (const name in schema) {
      const option: Option = schema[name]
      option.name = name
      options.push(option)
    }
    return options
  }

  async initialize () {
    const ruleClassPath: string = path.join(__dirname, 'Rules')
    const entries: string[] = await readdir.async(ruleClassPath)
    this.ruleClasses = entries
      .map(entry => require(path.join(ruleClassPath, entry)).default)
  }

  getConsumer (jobName: string | null): StateConsumer {
    let consumer: StateConsumer | undefined = this.consumers.get(jobName)

    if (!consumer) {
      consumer = new StateConsumer(this.state, this.getJobOptions(jobName))
      this.consumers.set(jobName, consumer)
    }

    return consumer
  }

  async setInstanceOptions (options: object = {}) {
    const instance = await this.getFile('dicy-instance.yaml-ParsedYAML')
    if (instance) {
      instance.readOnly = false
      instance.value = options
      instance.readOnly = true
    } else {
      this.error('Unable to set instance options.')
    }
  }

  async analyzePhase (command: Command, phase: Phase) {
    this.checkForKill()

    for (const ruleClass of this.ruleClasses) {
      const jobNames = ruleClass.ignoreJobName ? [null] : this.options.jobNames
      for (const jobName of jobNames) {
        const rule = await ruleClass.analyzePhase(this.getConsumer(jobName), command, phase)
        if (rule) {
          await this.addRule(rule)
        }
      }
    }
  }

  async analyzeFiles (command: Command, phase: Phase) {
    this.checkForKill()

    while (true) {
      const file: File | undefined = Array.from(this.files).find(file => !file.analyzed)

      if (!file) break

      for (const ruleClass of this.ruleClasses) {
        const jobNames: (string | null)[] = file.jobNames.size === 0 ? [null] : Array.from(file.jobNames.values())
        for (const jobName of jobNames) {
          const rules: Rule[] = await ruleClass.analyzeFile(this.getConsumer(jobName), command, phase, file)
          for (const rule of rules) {
            await this.addRule(rule)
          }
        }
      }

      file.analyzed = true
    }
  }

  getAvailableRules (command?: Command): RuleInfo[] {
    return this.ruleClasses
      .filter(rule => !command || rule.commands.has(command))
      .map(rule => ({ name: rule.name, description: rule.description }))
  }

  async evaluateRule (rule: Rule, action: Action): Promise<boolean> {
    this.checkForKill()

    if (rule.failures.has(action)) {
      this.info(`Skipping rule ${rule.id} because of previous failure.`)
      return false
    }

    await rule.evaluate(action)
    return true
  }

  async evaluate (command: Command, phase: Phase, action: Action): Promise<boolean> {
    this.checkForKill()

    const primaryCount = (ruleGroup: Rule[]) => ruleGroup.reduce(
      (total, rule) => total + rule.parameters.reduce((count, parameter) => parameter.filePath === this.filePath ? count + 1 : count, 0),
      0)
    const evaluationNeeded = (rule: Rule): boolean => rule.actions.has(action) && rule.command === command && rule.phase === phase

    // First separate the rule graph into connected components. For each
    // component only retain rules that are pertinent to the current command,
    // phase and action. Rank the rules in the component by the number of other
    // rules that it is directly dependent on within the same component. Only
    // retain those that have the lowest dependency rank. Sort the remaining
    // rules by number of inputs in an ascending order. Finally sort the
    // components by number of primaries in an ascending order. A rule is
    // considered a primary is it has as an input the main source file for that
    // job. Note: we are using lodash's sortBy because the standard sort is
    // not guaranteed to be a stable sort.
    const rules: Rule[] = _.flatten(_.sortBy(this.components
      .map(component => {
        const ruleGroup = _.sortBy(component.filter(evaluationNeeded), [(rule: Rule) => rule.inputs.length])
        type RuleGroupRanking = { rank: number, rules: Rule[] }

        return ruleGroup.reduce((current: RuleGroupRanking, rule: Rule): RuleGroupRanking => {
          // Rank the rule by how many other rules it is directly dependent on.
          const rank = ruleGroup.reduce(
            (count, otherRule) => this.isGrandparentOf(rule, otherRule) ? count + 1 : count,
            0)

          // The rank is lower than the current rank so start a new list.
          if (rank < current.rank) return { rank, rules: [rule] }
          // The ranks is the same as the current rank so just add us to the
          if (rank === current.rank) current.rules.push(rule)
          // list.

          return current
        }, { rank: Number.MAX_SAFE_INTEGER, rules: [] }).rules
      }), [primaryCount]))

    if (rules.length === 0) return false

    let didEvaluation: boolean = false

    for (const rule of rules) {
      await this.checkUpdates(command, phase)
      didEvaluation = await this.evaluateRule(rule, action) || didEvaluation
    }

    await this.checkUpdates(command, phase)

    return didEvaluation
  }

  async checkUpdates (command: Command, phase: Phase) {
    this.checkForKill()

    for (const file of this.files) {
      for (const rule of this.getInputRules(file)) {
        await rule.addFileActions(file, command, phase)
      }
      file.hasBeenUpdated = false
    }
  }

  kill (message: string = 'Build was killed.'): Promise<void> {
    if (!this.killToken) return Promise.resolve()

    if (!this.killToken.promise) {
      this.killToken.error = new Error(message)
      this.killToken.promise = new Promise(resolve => {
        if (this.killToken) this.killToken.resolve = resolve
        this.killChildProcesses()
      })
    }

    return this.killToken.promise
  }

  async run (...commands: Command[]): Promise<boolean> {
    if (this.killToken) {
      this.error('Build currently in progress')
      return false
    }

    const invalidCommands = commands.filter(command => !VALID_COMMAND_PATTERN.test(command))
    if (invalidCommands.length !== 0) {
      this.error(`Aborting due to receiving the following invalid commands: ${invalidCommands.join(', ')}`)
      return false
    }

    this.killToken = {}

    let success = true
    const phases: Phase[] = ['initialize', 'execute', 'finalize']

    try {
      for (const command of commands) {
        for (const phase of phases) {
          await this.runPhase(command, phase)
        }
      }
      success = Array.from(this.rules).every(rule => rule.failures.size === 0)
    } catch (error) {
      success = false
      this.error(error.stack)
    } finally {
      if (this.killToken && this.killToken.resolve) {
        success = false
        this.killToken.resolve()
      }
      this.killToken = null
    }

    return success
  }

  async runPhase (command: Command, phase: Phase): Promise<void> {
    const actions: Action[] = ['parse', 'updateDependencies', 'run']

    this.checkForKill()

    for (const file of this.files) {
      file.restoreUpdateFlag()
      file.analyzed = false
    }

    for (const rule of this.rules) {
      await rule.phaseInitialize(command, phase)
    }

    await this.analyzePhase(command, phase)

    for (let cycle = 0; cycle < this.options.phaseCycles; cycle++) {
      let didEvaluation = false

      for (const action of actions) {
        await this.analyzeFiles(command, phase)
        didEvaluation = await this.evaluate(command, phase, action) || didEvaluation
      }

      if (Array.from(this.files).every(file => file.analyzed) &&
        Array.from(this.rules).every(rule => rule.command !== command || rule.phase !== phase || !rule.needsEvaluation)) break

      if (!didEvaluation) break
    }
  }

  async updateOptions (options: object = {}, user: boolean = false): Promise<object> {
    const normalizedOptions = {}
    const filePath = this.resolvePath(user ? '$HOME/.dicy.yaml' : '$ROOTDIR/$NAME.yaml')

    if (await File.canRead(filePath)) {
      const currentOptions = await File.readYaml(filePath)
      this.assignOptions(currentOptions, normalizedOptions)
    }

    this.assignOptions(options, normalizedOptions)
    await File.writeYaml(filePath, normalizedOptions)

    return normalizedOptions
  }
}
