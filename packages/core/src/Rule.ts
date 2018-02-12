import * as _ from 'lodash'
import * as path from 'path'
import * as childProcess from 'child_process'

import { Command, OptionsInterface } from '@dicy/types'

import State from './State'
import File from './File'
import StateConsumer from './StateConsumer'
import {
  Action, CommandOptions, DependencyType, Group, ParsedLog, Phase,
  ProcessResults, RuleDescription
} from './types'

export default class Rule extends StateConsumer {
  static descriptions: RuleDescription[] = []
  static alwaysEvaluate: boolean = false
  static ignoreJobName: boolean = false
  static defaultActions: Action[] = ['run']

  readonly id: string
  readonly command: Command
  readonly phase: Phase
  readonly parameters: File[] = []
  actions: Map<Action, Set<File>> = new Map()
  failures: Set<Action> = new Set<Action>()

  constructor (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: File[] = []) {
    super(state, options, true)

    this.parameters = parameters
    this.command = command
    this.phase = phase
    this.id = state.getRuleId(this.constructor.name, command, phase, options.jobName, parameters.map(file => file.filePath))

    this.parameters.forEach((file, index) => {
      const { dir, base, name, ext } = path.parse(file.filePath)
      const rootPath = path.dirname(file.realFilePath)

      this.env[`FILEPATH_${index}`] = file.filePath
      this.env[`ROOTDIR_${index}`] = rootPath
      this.env[`DIR_${index}`] = dir || '.'
      this.env[`BASE_${index}`] = base
      this.env[`NAME_${index}`] = name
      this.env[`EXT_${index}`] = ext

      if (options.jobName) file.jobNames.add(options.jobName)
      this.addInput(this, file)
    })
  }

  static async analyzePhase (consumer: StateConsumer, command: Command, phase: Phase): Promise<Rule | undefined> {
    const appliesToPhase: boolean = this.descriptions.some(x =>
      x.commands.includes(command) && x.phases.includes(phase) &&
      (!x.parameters || x.parameters.length === 0))

    if (appliesToPhase && await this.isApplicable(consumer, command, phase)) {
      const rule = new this(consumer.state, command, phase, consumer.options)
      await rule.initialize()
      if (this.alwaysEvaluate) rule.addActions()
      return rule
    }
  }

  static async analyzeFile (consumer: StateConsumer, command: Command, phase: Phase, file: File): Promise<Rule[]> {
    const rules: Rule[] = []

    for (const description of this.descriptions) {
      if (description.commands.includes(command) && description.phases.includes(phase) &&
        description.parameters && description.parameters.some(types => file && file.inTypeSet(types))) {

        const files: File[] = Array.from(consumer.files).filter(file => !consumer.options.jobName || file.jobNames.has(consumer.options.jobName))

        for (let i = 0; i < description.parameters.length; i++) {
          if (file.inTypeSet(description.parameters[i])) {
            const candidates: File[][] = description.parameters.map((types, index) =>
              (index === i)
                ? [file]
                : files.filter(file => file.inTypeSet(types)))
            let indicies = candidates.map(files => files.length - 1)

            while (indicies.every(index => index > -1)) {
              const parameters: File[] = candidates.map((files, index) => files[indicies[index]])
              const ruleId: string = consumer.getRuleId(this.name, command, phase, consumer.options.jobName, parameters.map(file => file.filePath))

              if (!consumer.hasRule(ruleId) && await this.isApplicable(consumer, command, phase, parameters)) {
                const rule = new this(consumer.state, command, phase, consumer.options, parameters)
                await rule.initialize()
                if (this.alwaysEvaluate) rule.addActions(file)
                rules.push(rule)
              }

              let j = 0
              while (j < indicies.length && --indicies[j] < 0) {
                indicies[j] = candidates[j].length - 1
                j++
              }

              if (j === indicies.length) break
            }
          }
        }
      }
    }

    return rules
  }

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return true
  }

  get group (): Group | undefined {
    return undefined
  }

  get rank (): number | undefined {
    if (this.group) {
      const names: string[] = this.options[this.group] || []
      const rank = names.indexOf(_.kebabCase(this.constructor.name))
      if (rank > -1) return rank
    }
  }

  error (text: string, category?: string, name?: string) {
    super.error(text, category, name || this.id)
  }

  warning (text: string, category?: string, name?: string) {
    super.warning(text, category, name || this.id)
  }

  info (text: string, category?: string, name?: string) {
    super.info(text, category, name || this.id)
  }

  trace (text: string, category?: string, name?: string) {
    super.trace(text, category, name || this.id)
  }

  /* tslint:disable:no-empty */
  async initialize () {}

  async phaseInitialize (command: Command, phase: Phase) {
    if (command === this.command && phase === this.phase && (this.constructor as typeof Rule).alwaysEvaluate) {
      if (this.inputs.length === 0) {
        this.addActions()
      } else {
        for (const input of this.inputs) {
          this.addActions(input, await this.getFileActions(input))
        }
      }
    }
  }

  async addFileActions (file: File, command?: Command, phase?: Phase): Promise<void> {
    if ((!command || command === this.command) && (!phase || phase === this.phase) && file.hasBeenUpdated) {
      const timeStamp: Date | undefined = this.timeStamp
      const ruleNeedsUpdate = !timeStamp || timeStamp < file.timeStamp
      for (const action of await this.getFileActions(file)) {
        if (ruleNeedsUpdate) this.failures.delete(action)
        if (action === 'updateDependencies' || ruleNeedsUpdate) {
          this.addActions(file, [action])
        }
      }
    }
  }

  checkForActionVeto (command: Command, phase: Phase, action: Action): void {
    if (this.command === command && this.phase === phase && this.group && this.actions.has(action)) {
      const myRank = this.rank

      if (myRank === undefined) {
        this.trace(`Vetoing ${action} action because rule has no rank in group.`)
        this.actions.delete(action)
        return
      }

      const lowestRank = Math.min(...Array.from(this.rules)
        .filter(rule => rule.command === command && rule.phase === phase &&
          rule.group === this.group &&
          this.firstParameter === rule.firstParameter)
        .map(rule => rule.rank)
        .filter(rank => rank !== undefined) as number[])

      if (myRank > lowestRank) {
        this.trace(`Vetoing ${action} action becase rule is lower ranked then others in group.`)
        this.actions.delete(action)
      }
    }
  }

  async getFileActions (file: File): Promise<Action[]> {
    return (this.constructor as typeof Rule).defaultActions
  }

  addActions (file?: File, actions?: Action[]): void {
    if (!actions) actions = (this.constructor as typeof Rule).defaultActions

    for (const action of actions || []) {
      const files: Set<File> | undefined = this.actions.get(action)
      if (!files) {
        this.actions.set(action, new Set(file ? [file] : []))
      } else if (file) {
        files.add(file)
      }
    }
  }

  get firstParameter (): File {
    return this.parameters[0]
  }

  get secondParameter (): File {
    return this.parameters[1]
  }

  get thirdParameter (): File {
    return this.parameters[2]
  }

  get needsEvaluation (): boolean {
    return this.actions.size !== 0
  }

  get timeStamp (): Date | undefined {
    return this.outputs.reduce(
      (timestamp: Date | undefined, file: File): Date | undefined =>
        !timestamp || file.timeStamp > timestamp ? file.timeStamp : timestamp, undefined)
  }

  get inputs (): File[] {
    return this.getInputFiles(this)
  }

  get outputs (): File[] {
    return this.getOutputFiles(this)
  }

  async preEvaluate (): Promise<void> {}

  async evaluate (action: Action): Promise<boolean> {
    try {
      let success: boolean = true

      await this.preEvaluate()
      if (!this.actions.has(action)) return true
      this.actionTrace(action)

      switch (action) {
        case 'parse':
          success = await this.parse()
          break
        case 'updateDependencies':
          success = await this.updateDependencies()
          break
        default:
          success = await this.run()
          break
      }

      if (success) {
        this.failures.delete(action)
      } else {
        this.failures.add(action)
      }
      this.actions.delete(action)
      await this.updateOutputs()

      return success
    } catch (error) {
      this.error(error.stack)
    }

    return false
  }

  async updateDependencies (): Promise<boolean> {
    const files = this.actions.get('updateDependencies')

    if (files) {
      for (const file of files.values()) {
        const parsedLog: ParsedLog | undefined = file.value

        if (parsedLog) {
          if (parsedLog.inputs) await this.getInputs(parsedLog.inputs)
          if (parsedLog.outputs) await this.getOutputs(parsedLog.outputs)
        }
      }
    }

    return true
  }

  async executeCommand (commandOptions: CommandOptions): Promise<childProcess.ChildProcess | ProcessResults> {
    const result = await super.executeCommand(commandOptions)

    if (commandOptions.inputs) {
      for (const dependency of commandOptions.inputs) {
        await this.getResolvedInput(dependency.file, dependency.type)
      }
    }

    if (commandOptions.outputs) {
      for (const dependency of commandOptions.outputs) {
        await this.getResolvedOutput(dependency.file, dependency.type)
      }
    }

    if (commandOptions.globbedInputs) {
      for (const dependency of commandOptions.globbedInputs) {
        await this.getGlobbedInputs(dependency.file, dependency.type)
      }
    }

    if (commandOptions.globbedOutputs) {
      for (const dependency of commandOptions.globbedOutputs) {
        await this.getGlobbedOutputs(dependency.file, dependency.type)
      }
    }

    if ((result as childProcess.ChildProcess).pid) return result

    if (typeof commandOptions.stdout === 'string') {
      const output = await this.getResolvedOutput(commandOptions.stdout)
      if (output) output.value = result.stdout
    }

    if (typeof commandOptions.stderr === 'string') {
      const output = await this.getResolvedOutput(commandOptions.stderr)
      if (output) output.value = result.stderr
    }

    return result
  }

  async run (): Promise<boolean> {
    try {
      const commandOptions: CommandOptions = this.constructCommand()

      await this.executeCommand(commandOptions)

      return true
    } catch (error) {
      return false
    }
  }

  async parse (): Promise<boolean> {
    return true
  }

  async getOutput (filePath: string, type?: DependencyType): Promise<File | undefined> {
    let file: File | undefined = await this.getFile(filePath)

    if (file && !this.hasOutput(this, file, type)) {
      this.addOutput(this, file, type)
      this.trace(`Output added: \`${file.filePath}\``, 'output')
    }

    return file
  }

  async getOutputs (filePaths: string[], type?: DependencyType): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getOutput(filePath, type)
      if (file) files.push(file)
    }

    return files
  }

  async updateOutputs () {
    for (const file of this.outputs) {
      if (await file.update()) {
        this.trace(`File changed: \`${file.filePath}\``, 'file')
      }
    }
  }

  async getInput (filePath: string, type?: DependencyType): Promise<File | undefined> {
    let file: File | undefined = await this.getFile(filePath)

    if (file && !this.hasInput(this, file, type)) {
      this.addInput(this, file, type)
      this.trace(`Input added: \`${file.filePath}\``, 'input')
    }

    return file
  }

  async getInputs (filePaths: string[], type?: DependencyType): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getInput(filePath, type)
      if (file) files.push(file)
    }

    return files
  }

  async removeFileFromRule (file: File): Promise<boolean> {
    this.removeInput(this, file)
    this.removeOutput(this, file)

    return this.parameters.includes(file)
  }

  async getResolvedInput (filePath: string, type?: DependencyType): Promise<File | undefined> {
    const expanded = this.resolvePath(filePath)
    return this.getInput(expanded, type)
  }

  async getResolvedInputs (filePaths: string[], type?: DependencyType): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getResolvedInput(filePath, type)
      if (file) files.push(file)
    }

    return files
  }

  async getResolvedOutput (filePath: string, type?: DependencyType): Promise<File | undefined> {
    const expanded = this.resolvePath(filePath)
    return this.getOutput(expanded, type)
  }

  async getResolvedOutputs (filePaths: string[], type?: DependencyType): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getResolvedOutput(filePath, type)
      if (file) files.push(file)
    }

    return files
  }

  async getGlobbedInputs (pattern: string, type?: DependencyType): Promise<File[]> {
    const files = []
    for (const filePath of await this.globPath(pattern)) {
      const file = await this.getInput(filePath, type)
      if (file) files.push(file)
    }
    return files
  }

  async getGlobbedOutputs (pattern: string, type?: DependencyType): Promise<File[]> {
    const files = []
    for (const filePath of await this.globPath(pattern)) {
      const file = await this.getOutput(filePath, type)
      if (file) files.push(file)
    }
    return files
  }

  constructCommand (): CommandOptions {
    return { command: [], cd: '$ROOTDIR' }
  }

  actionTrace (action: Action) {
    const files: Set<File> | undefined = this.actions.get(action)
    const triggers: string[] = files ? Array.from(files).map(file => file.filePath) : []
    const triggerText = triggers.length !== 0 ? ` triggered by updates to ${triggers}` : ''

    this.trace(`Evaluating ${action} action${triggerText}`, 'action')
  }
}
