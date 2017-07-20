/* @flow */

import path from 'path'
import commandJoin from 'command-join'

import State from './State'
import File from './File'
import StateConsumer from './StateConsumer'

import type { Action, Command, Phase, CommandOptions, ParsedLog } from './types'

export default class Rule extends StateConsumer {
  static parameterTypes: Array<Set<string>> = []
  static phases: Set<Phase> = new Set(['execute'])
  static commands: Set<Command> = new Set(['build'])
  static alwaysEvaluate: boolean = false
  static ignoreJobName: boolean = false
  static defaultActions: Array<Action> = ['run']
  static description: string = ''

  id: string
  command: Command
  phase: Phase
  parameters: Array<File> = []
  inputs: Map<string, File> = new Map()
  outputs: Map<string, File> = new Map()
  actions: Map<Action, Set<File>> = new Map()
  failures: Set<Action> = new Set()

  static async analyzePhase (state: State, command: Command, phase: Phase, jobName: ?string): Promise<?Rule> {
    if (await this.appliesToPhase(state, command, phase, jobName)) {
      const rule = new this(state, command, phase, jobName)
      await rule.initialize()
      if (rule.alwaysEvaluate) rule.addActions()
      return rule
    }
  }

  static async appliesToPhase (state: State, command: Command, phase: Phase, jobName: ?string): Promise<boolean> {
    return this.commands.has(command) &&
      this.phases.has(phase) &&
      this.parameterTypes.length === 0
  }

  static async analyzeFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<Array<Rule>> {
    const rules = []

    if (await this.appliesToFile(state, command, phase, jobName, file)) {
      const files = Array.from(state.files.values()).filter(file => !jobName || file.jobNames.has(jobName))

      for (let i = 0; i < this.parameterTypes.length; i++) {
        if (file.inTypeSet(this.parameterTypes[i])) {
          const candidates: Array<Array<File>> = this.parameterTypes.map((types, index) =>
            (index === i)
              ? [file]
              : files.filter(file => file.inTypeSet(types)))
          let indicies = candidates.map(files => files.length - 1)

          while (indicies.every(index => index > -1)) {
            const parameters = candidates.map((files, index) => files[indicies[index]])
            const ruleId = state.getRuleId(this.name, command, phase, jobName, ...parameters)

            if (!state.rules.has(ruleId)) {
              const rule = new this(state, command, phase, jobName, ...parameters)
              await rule.initialize()
              if (rule.alwaysEvaluate) rule.addActions(file)
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

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return this.commands.has(command) &&
      this.phases.has(phase) &&
      this.parameterTypes.some(types => file.inTypeSet(types))
  }

  constructor (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>) {
    super(state, jobName)

    this.parameters = parameters
    this.command = command
    this.phase = phase
    this.id = state.getRuleId(this.constructor.name, command, phase, jobName, ...parameters)

    this.parameters.forEach((file, index) => {
      const { dir, base, name, ext } = path.parse(file.filePath)
      const rootPath = path.dirname(file.realFilePath)

      this.env[`ROOTDIR_${index}`] = rootPath
      this.env[`DIR_${index}`] = dir || '.'
      this.env[`BASE_${index}`] = base
      this.env[`NAME_${index}`] = name
      this.env[`EXT_${index}`] = ext

      if (jobName) file.jobNames.add(jobName)
      this.inputs.set(file.filePath, file)
      // $FlowIgnore
      file.addRule(this)
    })
  }

  async initialize () {}

  async phaseInitialize (command: ?Command, phase: ?Phase) {
    if ((!command || command === this.command) && (!phase || phase === this.phase) && this.constructor.alwaysEvaluate) {
      if (this.inputs.size === 0) {
        this.addActions()
      } else {
        for (const input of this.inputs.values()) {
          this.addActions(input, await this.getFileActions(input))
        }
      }
    }
  }

  async addFileActions (file: File, command: ?Command, phase: ?Phase): Promise<void> {
    if ((!command || command === this.command) && (!phase || phase === this.phase) && file.hasBeenUpdated) {
      const timeStamp: ?Date = this.timeStamp
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

    for (const action of actions) {
      const files: ?Set<File> = this.actions.get(action)
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

  get timeStamp (): ?Date {
    return Array.from(this.outputs.values()).reduce((c, t) => !c || t.timeStamp > c ? t.timeStamp : c, null)
  }

  async preEvaluate (): Promise<void> {}

  async evaluate (action: Action): Promise<boolean> {
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
  }

  async updateDependencies (): Promise<boolean> {
    const files = this.actions.get('updateDependencies')

    if (files) {
      for (const file of files.values()) {
        const parsedLog: ?ParsedLog = file.value

        if (parsedLog) {
          if (parsedLog.inputs) await this.getInputs(parsedLog.inputs)
          if (parsedLog.outputs) await this.getOutputs(parsedLog.outputs)
        }
      }
    }

    return true
  }

  async executeCommand (commandOptions: CommandOptions): Promise<Object> {
    const options = this.constructProcessOptions(commandOptions.cd)
    const command = commandJoin(commandOptions.args.map(arg => arg.startsWith('$') ? this.resolvePath(arg) : arg))

    this.emit('command', {
      type: 'command',
      rule: this.id,
      command
    })

    const { stdout, stderr, error } = await this.executeChildProcess(command, options)

    if (error) {
      this.log({ severity: commandOptions.severity, text: error.toString(), name: this.constructor.name })
    }

    if (commandOptions.inputs) await this.getResolvedInputs(commandOptions.inputs)

    if (commandOptions.outputs) await this.getResolvedOutputs(commandOptions.outputs)

    if (commandOptions.globbedInputs) {
      await Promise.all(commandOptions.globbedInputs.map(pattern => this.getGlobbedInputs(pattern)))
    }

    if (commandOptions.globbedOutputs) {
      await Promise.all(commandOptions.globbedOutputs.map(pattern => this.getGlobbedOutputs(pattern)))
    }

    if (commandOptions.stdout) {
      const output = await this.getResolvedOutput(commandOptions.stdout)
      if (output) output.value = stdout
    }

    if (commandOptions.stderr) {
      const output = await this.getResolvedOutput(commandOptions.stderr)
      if (output) output.value = stderr
    }

    return { stdout, stderr, error }
  }

  async run (): Promise<boolean> {
    const commandOptions: CommandOptions = this.constructCommand()
    const { error } = await this.executeCommand(commandOptions)

    return !error
  }

  async parse (): Promise<boolean> {
    return true
  }

  addOutput (file: ?File): void {
    if (!file) return
    if (!this.outputs.has(file.filePath)) {
      this.outputs.set(file.filePath, file)
      this.emit('outputAdded', {
        type: 'outputAdded',
        rule: this.id,
        file: file.filePath,
        virtual: file.virtual
      })
    }
  }

  async getOutput (filePath: string): Promise<?File> {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.outputs.get(filePath)

    if (!file) {
      file = await this.getFile(filePath)
      this.addOutput(file)
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
    for (const file: File of this.outputs.values()) {
      if (await file.update()) {
        this.emit('fileChanged', {
          type: 'fileChanged',
          file,
          virtual: file.virtual
        })
      }
    }
  }

  addInput (file: ?File) {
    if (!file) return
    if (!this.inputs.has(file.filePath)) {
      // $FlowIgnore
      file.addRule(this)
      this.inputs.set(file.filePath, file)
      this.emit('inputAdded', {
        type: 'inputAdded',
        rule: this.id,
        file: file.filePath,
        virtual: file.virtual
      })
    }
  }

  async getInput (filePath: string): Promise<?File> {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.inputs.get(filePath)

    if (!file) {
      file = await this.getFile(filePath)
      this.addInput(file)
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
    this.inputs.delete(file.filePath)
    this.outputs.delete(file.filePath)

    if (this.parameters.includes(file)) {
      for (const input of this.inputs.values()) {
        // $FlowIgnore
        input.removeRule(this)
      }
      return true
    }

    // $FlowIgnore
    file.removeRule(this)
    return false
  }

  async getResolvedInput (filePath: string): Promise<?File> {
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

  async getResolvedOutput (filePath: string): Promise<?File> {
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

  constructProcessOptions (cd: string): Object {
    const processOptions = {
      maxBuffer: 524288,
      cwd: this.resolvePath(cd),
      env: Object.assign({}, process.env)
    }

    for (const [name, value] of this.state.getOptions(this.jobName)) {
      if (!name.startsWith('$')) continue
      const envName = (process.platform === 'win32' && name === '$PATH') ? 'Path' : name.substring(1)
      if (Array.isArray(value)) {
        const emptyPath = (name === '$PATH') ? process.env[envName] : ''
        const paths: Array<string> = value.map(filePath => filePath ? this.resolvePath(filePath) : emptyPath)

        if (processOptions.env[envName] && paths.length > 0 && paths[paths.length - 1] === '') {
          paths[paths.length - 1] = processOptions.env[envName]
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
    const files: ?Set<File> = this.actions.get(action)
    this.emit('action', {
      type: 'action',
      action,
      rule: this.id,
      triggers: files ? Array.from(files).map(file => file.filePath) : []
    })
  }
}
