import * as path from 'path'
const commandJoin = require('command-join')

import { Command, OptionsInterface } from '@dicy/types'

import State from './State'
import File from './File'
import StateConsumer from './StateConsumer'
import {
  Action,
  CommandOptions,
  ParsedLog,
  Phase,
  ProcessResults
} from './types'

export default class Rule extends StateConsumer {
  static parameterTypes: Set<string>[] = []
  static phases: Set<Phase> = new Set<Phase>(['execute'])
  static commands: Set<Command> = new Set<Command>(['build'])
  static alwaysEvaluate: boolean = false
  static ignoreJobName: boolean = false
  static defaultActions: Action[] = ['run']
  static description: string = ''

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
    const appliesToPhase: boolean = this.commands.has(command) && this.phases.has(phase) &&
          this.parameterTypes.length === 0

    if (appliesToPhase && await this.isApplicable(consumer, command, phase)) {
      const rule = new this(consumer.state, command, phase, consumer.options)
      await rule.initialize()
      if (this.alwaysEvaluate) rule.addActions()
      return rule
    }
  }

  static async analyzeFile (consumer: StateConsumer, command: Command, phase: Phase, file: File): Promise<Rule[]> {
    const rules: Rule[] = []
    const appliesToFile: boolean = this.commands.has(command) && this.phases.has(phase) &&
          this.parameterTypes.some(types => file && file.inTypeSet(types))

    if (appliesToFile) {
      const files: File[] = Array.from(consumer.files).filter(file => !consumer.options.jobName || file.jobNames.has(consumer.options.jobName))

      for (let i = 0; i < this.parameterTypes.length; i++) {
        if (file.inTypeSet(this.parameterTypes[i])) {
          const candidates: File[][] = this.parameterTypes.map((types, index) =>
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

    return rules
  }

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return true
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

  resolveAllPaths (value: string): string {
    return value.replace(/\{\{(.*?)\}\}/, (match, filePath) => this.resolvePath(filePath))
  }

  async executeCommand (commandOptions: CommandOptions): Promise<ProcessResults> {
    try {
      // We only capture stdout and stderr if explicitly instructed to. This is
      // possibly to conserve some memory, but mostly it is a work around for a
      // bug in CLISP <https://sourceforge.net/p/clisp/bugs/378/> which makes it
      // impossible to run xindy without pseudo terminal support.
      const options = this.constructProcessOptions(commandOptions.cd,
        false, !!commandOptions.stdout, !!commandOptions.stderr)
      // Use ampersand as a filler for empty arguments. This is to work around
      // a bug in command-join.
      const command = commandJoin(commandOptions.args.map(arg => this.resolveAllPaths(arg) || '&'))
        .replace(/(['"])\^?&(['"])/g, '$1$2')

      this.info(`Executing \`${command}\``, 'command')

      const result = await this.executeChildProcess(command, options)

      if (commandOptions.inputs) await this.getResolvedInputs(commandOptions.inputs)

      if (commandOptions.outputs) await this.getResolvedOutputs(commandOptions.outputs)

      if (commandOptions.globbedInputs) {
        await Promise.all(commandOptions.globbedInputs.map(pattern => this.getGlobbedInputs(pattern)))
      }

      if (commandOptions.globbedOutputs) {
        await Promise.all(commandOptions.globbedOutputs.map(pattern => this.getGlobbedOutputs(pattern)))
      }

      if (typeof commandOptions.stdout === 'string') {
        const output = await this.getResolvedOutput(commandOptions.stdout)
        if (output) output.value = result.stdout
      }

      if (typeof commandOptions.stderr === 'string') {
        const output = await this.getResolvedOutput(commandOptions.stderr)
        if (output) output.value = result.stderr
      }

      return result
    } catch (error) {
      this.log({ severity: commandOptions.severity, text: error.toString(), name: this.constructor.name })
      throw error
    }
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

  async getOutput (filePath: string): Promise<File | undefined> {
    let file: File | undefined = await this.getFile(filePath)

    if (file && !this.hasOutput(this, file)) {
      this.addOutput(this, file)
      this.trace(`Output added: \`${file.filePath}\``, 'output')
    }

    return file
  }

  async getOutputs (filePaths: string[]): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getOutput(filePath)
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

  async getInput (filePath: string): Promise<File | undefined> {
    let file: File | undefined = await this.getFile(filePath)

    if (file && !this.hasInput(this, file)) {
      this.addInput(this, file)
      this.trace(`Input added: \`${file.filePath}\``, 'input')
    }

    return file
  }

  async getInputs (filePaths: string[]): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getInput(filePath)
      if (file) files.push(file)
    }

    return files
  }

  async removeFileFromRule (file: File): Promise<boolean> {
    this.removeInput(this, file)
    this.removeOutput(this, file)

    return this.parameters.includes(file)
  }

  async getResolvedInput (filePath: string): Promise<File | undefined> {
    const expanded = this.resolvePath(filePath)
    return this.getInput(expanded)
  }

  async getResolvedInputs (filePaths: string[]): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getResolvedInput(filePath)
      if (file) files.push(file)
    }

    return files
  }

  async getResolvedOutput (filePath: string): Promise<File | undefined> {
    const expanded = this.resolvePath(filePath)
    return this.getOutput(expanded)
  }

  async getResolvedOutputs (filePaths: string[]): Promise<File[]> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getResolvedOutput(filePath)
      if (file) files.push(file)
    }

    return files
  }

  async getGlobbedInputs (pattern: string): Promise<File[]> {
    const files = []
    for (const filePath of await this.globPath(pattern)) {
      const file = await this.getInput(filePath)
      if (file) files.push(file)
    }
    return files
  }

  async getGlobbedOutputs (pattern: string): Promise<File[]> {
    const files = []
    for (const filePath of await this.globPath(pattern)) {
      const file = await this.getOutput(filePath)
      if (file) files.push(file)
    }
    return files
  }

  constructProcessOptions (cd: string, stdin: boolean, stdout: boolean, stderr: boolean): object {
    const processOptions = {
      cwd: this.resolvePath(cd),
      env: Object.assign({}, process.env),
      shell: true,
      stdio: [
        stdin ? 'pipe' : 'ignore',
        stdout ? 'pipe' : 'ignore',
        stderr ? 'pipe' : 'ignore'
      ]
    }

    for (const name in this.options) {
      if (!name.startsWith('$')) continue
      const value = this.options[name]
      const envName = (process.platform === 'win32' && name === '$PATH') ? 'Path' : name.substring(1)
      if (Array.isArray(value)) {
        const emptyPath = (name === '$PATH') ? process.env[envName] || '' : ''
        const paths: string[] = value.map(filePath => filePath ? this.resolvePath(filePath.toString()) : emptyPath)

        if (processOptions.env[envName] && paths.length > 0 && paths[paths.length - 1] === '') {
          paths[paths.length - 1] = processOptions.env[envName] || ''
        }

        processOptions.env[envName] = paths.join(path.delimiter)
      } else if (typeof value === 'string') {
        processOptions.env[envName] = this.expandVariables(value)
      } else {
        processOptions.env[envName] = value.toString()
      }
    }

    return processOptions
  }

  constructCommand (): CommandOptions {
    return { args: [], cd: '$ROOTDIR', severity: 'error' }
  }

  actionTrace (action: Action) {
    const files: Set<File> | undefined = this.actions.get(action)
    const triggers: string[] = files ? Array.from(files).map(file => file.filePath) : []
    const triggerText = triggers.length !== 0 ? ` triggered by updates to ${triggers}` : ''

    this.trace(`Evaluating ${action} action${triggerText}`, 'action')
  }
}
