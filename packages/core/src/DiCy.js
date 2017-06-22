/* @flow */

import path from 'path'
import readdir from 'readdir-enhanced'

import State from './State'
import StateConsumer from './StateConsumer'
import File from './File'
import Rule from './Rule'

import type { Action, Command, Option, Phase, RuleInfo } from './types'

export default class DiCy extends StateConsumer {
  static async create (filePath: string, options: Object = {}) {
    const schema = await DiCy.getOptionDefinitions()
    const state = await State.create(filePath, schema)
    const builder = new DiCy(state)

    await builder.initialize()
    await builder.setInstanceOptions(options)

    return builder
  }

  async initialize () {
    const ruleClassPath: string = path.join(__dirname, 'Rules')
    const entries: Array<string> = await readdir.async(ruleClassPath)
    this.state.ruleClasses = entries
      .map(entry => require(path.join(ruleClassPath, entry)).default)
  }

  async setInstanceOptions (options: Object = {}) {
    const instance = await this.getFile('dicy-instance.yaml-ParsedYAML')
    if (instance) instance.value = options
  }

  async analyzePhase (command: Command, phase: Phase) {
    this.checkForKill()

    for (const ruleClass: Class<Rule> of this.ruleClasses) {
      const jobNames = ruleClass.ignoreJobName ? [undefined] : this.options.jobNames
      for (const jobName of jobNames) {
        const rule = await ruleClass.analyzePhase(this.state, command, phase, jobName)
        if (rule) {
          await this.addRule(rule)
        }
      }
    }
  }

  async analyzeFiles (command: Command, phase: Phase) {
    this.checkForKill()

    let rulesAdded = false

    while (true) {
      const file: ?File = Array.from(this.files).find(file => !file.analyzed)

      if (!file) break

      for (const ruleClass: Class<Rule> of this.ruleClasses) {
        const jobNames = file.jobNames.size === 0 ? [undefined] : Array.from(file.jobNames.values())
        for (const jobName of jobNames) {
          const rules: Array<Rule> = await ruleClass.analyzeFile(this.state, command, phase, jobName, file)
          for (const rule of rules) {
            rulesAdded = true
            await this.addRule(rule)
          }
        }
      }

      file.analyzed = true
    }

    if (rulesAdded) this.calculateDistances()
  }

  getAvailableRules (command: ?Command): Array<RuleInfo> {
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

    const rules: Array<Rule> = Array.from(this.rules).filter(rule => rule.actions.has(action) && rule.command === command && rule.phase === phase)
    if (rules.length === 0) return false

    let didEvaluation: boolean = false
    const ruleGroups: Array<Array<Rule>> = []

    for (const rule of rules) {
      let notUsed = true
      for (const ruleGroup of ruleGroups) {
        if (this.isConnected(ruleGroup[0], rule)) {
          ruleGroup.push(rule)
          notUsed = false
          break
        }
      }
      if (notUsed) ruleGroups.push([rule])
    }

    const primaryCount = ruleGroup => ruleGroup.reduce(
      (total, rule) => total + rule.parameters.reduce((count, parameter) => parameter.filePath === this.filePath ? count + 1 : count, 0),
      0)

    ruleGroups.sort((x, y) => primaryCount(x) - primaryCount(y))

    for (const ruleGroup of ruleGroups) {
      let candidateRules = []
      let dependents = []
      let minimumCount = Number.MAX_SAFE_INTEGER

      for (const x of ruleGroup) {
        const inputCount = ruleGroup.reduce((count, y) => this.isChild(y, x) ? count + 1 : count, 0)
        if (inputCount === 0) {
          candidateRules.push(x)
        } else if (inputCount === minimumCount) {
          dependents.push(x)
        } else if (inputCount < minimumCount) {
          dependents = [x]
          minimumCount = inputCount
        }
      }

      if (candidateRules.length === 0) {
        candidateRules = dependents
      }

      candidateRules.sort((x, y) => x.inputs.size - y.inputs.size)

      for (const rule of candidateRules) {
        await this.checkUpdates(command, phase)
        didEvaluation = await this.evaluateRule(rule, action) || didEvaluation
      }
    }

    await this.checkUpdates(command, phase)

    return didEvaluation
  }

  async checkUpdates (command: Command, phase: Phase) {
    this.checkForKill()

    for (const file of this.files) {
      for (const rule of file.rules.values()) {
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
        // $FlowIgnore
        this.killToken.resolve = resolve
        this.killChildProcesses()
      })
    }

    return this.killToken.promise
  }

  async run (...commands: Array<Command>): Promise<boolean> {
    if (this.killToken) {
      this.error('Build currently in progress')
      return false
    }

    this.killToken = {}

    let success = true

    try {
      for (const command of commands) {
        for (const phase: Phase of ['initialize', 'execute', 'finalize']) {
          await this.runPhase(command, phase)
        }
      }
      success = Array.from(this.rules).every(rule => rule.failures.size === 0)
    } catch (error) {
      success = false
      this.error(error.message)
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
    this.checkForKill()

    for (const file of this.files) {
      file.hasBeenUpdated = file.hasBeenUpdatedCache
      file.analyzed = false
    }

    for (const rule of this.rules) {
      await rule.phaseInitialize(command, phase)
    }

    await this.analyzePhase(command, phase)

    for (let cycle = 0; cycle < this.options.phaseCycles; cycle++) {
      let didEvaluation = false

      for (const action of ['updateDependencies', 'run']) {
        await this.analyzeFiles(command, phase)
        didEvaluation = await this.evaluate(command, phase, action) || didEvaluation
      }

      if (Array.from(this.files).every(file => file.analyzed) &&
        Array.from(this.rules).every(rule => rule.command !== command || rule.phase !== phase || !rule.needsEvaluation)) break

      if (!didEvaluation) break
    }
  }

  static async getOptionDefinitions (): Promise<Array<Option>> {
    const filePath = path.resolve(__dirname, '..', 'resources', 'option-schema.yaml')
    const schema = await File.load(filePath)
    const options = []
    for (const name in schema) {
      const option = schema[name]
      option.name = name
      options.push(option)
    }
    return options
  }

  async updateOptions (options: Object = {}, user: boolean = false): Promise<Object> {
    const normalizedOptions = {}
    const filePath = this.resolvePath(user ? '$HOME/.dicy.yaml' : '$DIR/$NAME.yaml')

    if (await File.canRead(filePath)) {
      const currentOptions = await File.safeLoad(filePath)
      this.state.assignSubOptions(normalizedOptions, currentOptions)
    }

    this.state.assignSubOptions(normalizedOptions, options)
    await File.safeDump(filePath, normalizedOptions)

    return normalizedOptions
  }
}
