import * as path from 'path'
import * as commandJoin from 'command-join'

import State from './State'
import File from './File'
import StateConsumer from './StateConsumer'

import {
  Action,
  Command,
  CommandOptions,
  OptionsInterface,
  ParsedLog,
  Phase,
  ProcessResults
} from './types'

export default class Rule extends StateConsumer {
  static parameterTypes: Array<Set<string>> = []
  static phases: Set<Phase> = new Set<Phase>(['execute'])
  static commands: Set<Command> = new Set<Command>(['build'])
  static alwaysEvaluate: boolean = false
  static ignoreJobName: boolean = false
  static defaultActions: Array<Action> = ['run']
  static description: string = ''

  id: string
  command: Command
  phase: Phase
  parameters: Array<File> = []
  actions: Map<Action, Set<File>> = new Map()
  failures: Set<Action> = new Set<Action>()

  static async analyzePhase (state: State, command: Command, phase: Phase, options: OptionsInterface): Promise<Rule | undefined> {
    const appliesToPhase: boolean = this.commands.has(command) && this.phases.has(phase) &&
          this.parameterTypes.length === 0

    if (appliesToPhase && await this.isApplicable(state, command, phase, options)) {
      const rule = new this(state, command, phase, options)
      await rule.initialize()
      if (this.alwaysEvaluate) rule.addActions()
      return rule
    }
  }

  static async analyzeFile (state: State, command: Command, phase: Phase, options: OptionsInterface, file: File): Promise<Array<Rule>> {
    const rules: Array<Rule> = []
    const appliesToFile: boolean = this.commands.has(command) && this.phases.has(phase) &&
          this.parameterTypes.some(types => file && file.inTypeSet(types))

    if (appliesToFile) {
      const files: Array<File> = Array.from(state.files.values()).filter(file => !options.jobName || file.jobNames.has(options.jobName))

      for (let i = 0; i < this.parameterTypes.length; i++) {
        if (file.inTypeSet(this.parameterTypes[i])) {
          const candidates: Array<Array<File>> = this.parameterTypes.map((types, index) =>
            (index === i)
              ? [file]
              : files.filter(file => file.inTypeSet(types)))
          let indicies = candidates.map(files => files.length - 1)

          while (indicies.every(index => index > -1)) {
            const parameters: Array<File> = candidates.map((files, index) => files[indicies[index]])
            const ruleId: string = state.getRuleId(this.name, command, phase, options.jobName, parameters.map(file => file.filePath))

            if (!state.rules.has(ruleId) && await this.isApplicable(state, command, phase, options, parameters)) {
              const rule = new this(state, command, phase, options, parameters)
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

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: Array<File> = []): Promise<boolean> {
    return true
  }

  constructor (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: Array<File> = []) {
    super(state, options)

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
      state.addEdge(file.filePath, this.id)
    })
  }

  error (text: string, name?: string) {
    super.error(text, name || this.id)
  }

  warning (text: string, name?: string) {
    super.warning(text, name || this.id)
  }

  info (text: string, name?: string) {
    super.info(text, name || this.id)
  }

  async initialize () {}

  async phaseInitialize (command: Command, phase: Phase) {
    if (command === this.command && phase === this.phase && this.constructor.alwaysEvaluate) {
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

  async getFileActions (file: File): Promise<Array<Action>> {
    return this.constructor.defaultActions
  }

  addActions (file?: File, actions?: Array<Action>): void {
    if (!actions) actions = this.constructor.defaultActions

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

  get inputs (): Array<File> {
    const predecessors = this.state.graph.predecessors(this.id) || []
    return <File[]>predecessors.map(filePath => this.state.files.get(filePath)).filter(file => file)
  }

  get outputs (): Array<File> {
    const successors = this.state.graph.successors(this.id) || []
    return <File[]>successors.map(filePath => this.state.files.get(filePath)).filter(file => file)
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

      this.emit('command', {
        type: 'command',
        rule: this.id,
        command
      })

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

    if (file && !this.hasEdge(this.id, file.filePath)) {
      this.addEdge(this.id, file.filePath)
      this.emit('outputAdded', {
        type: 'outputAdded',
        rule: this.id,
        file: file.filePath,
        virtual: file.virtual
      })
    }

    return file
  }

  async getOutputs (filePaths: Array<string>): Promise<Array<File>> {
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
        this.emit('fileChanged', {
          type: 'fileChanged',
          file,
          virtual: file.virtual
        })
      }
    }
  }

  async getInput (filePath: string): Promise<File | undefined> {
    let file: File | undefined = await this.getFile(filePath)

    if (file && !this.hasEdge(file.filePath, this.id)) {
      this.addEdge(file.filePath, this.id)
      this.emit('inputAdded', {
        type: 'inputAdded',
        rule: this.id,
        file: file.filePath,
        virtual: file.virtual
      })
    }

    return file
  }

  async getInputs (filePaths: Array<string>): Promise<Array<File>> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getInput(filePath)
      if (file) files.push(file)
    }

    return files
  }

  async removeFile (file: File): Promise<boolean> {
    this.state.removeEdge(this.id, file.filePath)
    this.state.removeEdge(file.filePath, this.id)

    return this.parameters.includes(file)
  }

  async getResolvedInput (filePath: string): Promise<File | undefined> {
    const expanded = this.resolvePath(filePath)
    return this.getInput(expanded)
  }

  async getResolvedInputs (filePaths: Array<string>): Promise<Array<File>> {
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

  async getResolvedOutputs (filePaths: Array<string>): Promise<Array<File>> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getResolvedOutput(filePath)
      if (file) files.push(file)
    }

    return files
  }

  async getGlobbedInputs (pattern: string): Promise<Array<File>> {
    const files = []
    for (const filePath of await this.globPath(pattern)) {
      const file = await this.getInput(filePath)
      if (file) files.push(file)
    }
    return files
  }

  async getGlobbedOutputs (pattern: string): Promise<Array<File>> {
    const files = []
    for (const filePath of await this.globPath(pattern)) {
      const file = await this.getOutput(filePath)
      if (file) files.push(file)
    }
    return files
  }

  constructProcessOptions (cd: string, stdin: boolean, stdout: boolean, stderr: boolean): Object {
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
        const paths: Array<string> = value.map(filePath => filePath ? this.resolvePath(filePath.toString()) : emptyPath)

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
    this.emit('action', {
      type: 'action',
      action,
      rule: this.id,
      triggers: files ? Array.from(files).map(file => file.filePath) : []
    })
  }
}
