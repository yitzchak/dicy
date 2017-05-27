/* @flow */

import path from 'path'
import commandJoin from 'command-join'

import State from './State'
import File from './File'
import StateConsumer from './StateConsumer'

import type { Action, Command, Phase } from './types'

export default class Rule extends StateConsumer {
  static fileTypes: Set<string> = new Set()
  static phases: Set<Phase> = new Set(['execute'])
  static commands: Set<Command> = new Set(['build'])
  static alwaysEvaluate: boolean = false
  static ignoreJobName: boolean = false
  static description: string = ''

  id: string
  command: Command
  phase: Phase
  parameters: Array<File> = []
  inputs: Map<string, File> = new Map()
  outputs: Map<string, File> = new Map()
  actions: Map<Action, Set<File>> = new Map()
  success: boolean = true

  static async analyzePhase (state: State, command: Command, phase: Phase, jobName: ?string) {
    if (await this.appliesToPhase(state, command, phase, jobName)) {
      const rule = new this(state, command, phase, jobName)
      await rule.initialize()
      if (rule.alwaysEvaluate) rule.addAction()
      return rule
    }
  }

  static async appliesToPhase (state: State, command: Command, phase: Phase, jobName: ?string): Promise<boolean> {
    return this.commands.has(command) &&
      this.phases.has(phase) &&
      this.fileTypes.size === 0
  }

  static async analyzeFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<?Rule> {
    if (await this.appliesToFile(state, command, phase, jobName, file)) {
      const rule = new this(state, command, phase, jobName, file)
      await rule.initialize()
      if (rule.alwaysEvaluate) rule.addAction(file)
      return rule
    }
  }

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return this.commands.has(command) &&
      this.phases.has(phase) &&
      (this.fileTypes.has('*') || this.fileTypes.has(file.type)) &&
      Array.from(file.rules.values()).every(rule => rule.constructor.name !== this.name || rule.jobName !== jobName)
  }

  constructor (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>) {
    super(state, jobName)
    this.parameters = parameters
    this.command = command
    this.phase = phase
    this.id = state.getRuleId(this.constructor.name, command, phase, jobName, ...parameters)
    for (const file: File of parameters) {
      if (jobName) file.jobNames.add(jobName)
      this.inputs.set(file.filePath, file)
      // $FlowIgnore
      file.addRule(this)
    }
  }

  async initialize () {}

  async phaseInitialize (command: ?Command, phase: ?Phase) {
    if ((!command || command === this.command) && (!phase || phase === this.phase) && this.constructor.alwaysEvaluate) {
      if (this.inputs.size === 0) {
        this.addAction()
      } else {
        for (const input of this.inputs.values()) {
          for (const action of await this.getFileActions(input)) {
            this.addAction(input, action)
          }
        }
      }
    }
  }

  async addFileActions (file: File, command: ?Command, phase: ?Phase): Promise<void> {
    if ((!command || command === this.command) && (!phase || phase === this.phase) && file.hasBeenUpdated) {
      const timeStamp: ?Date = this.timeStamp
      const ruleNeedsUpdate = !timeStamp || timeStamp < file.timeStamp
      for (const action of await this.getFileActions(file)) {
        if (action === 'updateDependencies' || ruleNeedsUpdate) {
          this.addAction(file, action)
        }
      }
    }
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    return ['run']
  }

  addAction (file: ?File, action: Action = 'run'): void {
    const files: ?Set<File> = this.actions.get(action)
    if (!files) {
      this.actions.set(action, new Set(file ? [file] : []))
    } else if (file) {
      files.add(file)
    }
  }

  get firstParameter (): File {
    return this.parameters[0]
  }

  get secondParameter (): File {
    return this.parameters[1]
  }

  get needsEvaluation (): boolean {
    return this.actions.size !== 0
  }

  get timeStamp (): ?Date {
    return Array.from(this.outputs.values()).reduce((c, t) => !c || t.timeStamp > c ? t.timeStamp : c, null)
  }

  async preEvaluate (): Promise<void> {}

  async evaluate (action: Action): Promise<boolean> {
    await this.preEvaluate()

    if (!this.actions.has(action)) return true

    this.actionTrace(action)
    this.success = (action === 'updateDependencies')
      ? await this.updateDependencies()
      : await this.run()
    this.actions.delete(action)
    await this.updateOutputs()

    return this.success
  }

  async updateDependencies (): Promise<boolean> {
    const files = this.actions.get('updateDependencies')

    if (files) {
      for (const file of files.values()) {
        if (file.value) {
          if (file.value.inputs) await this.getInputs(file.value.inputs)
          if (file.value.outputs) await this.getOutputs(file.value.outputs)
        }
      }
    }

    return true
  }

  async run (): Promise<boolean> {
    let success: boolean = true
    const options = this.constructProcessOptions()
    const command = commandJoin(this.constructCommand())

    this.emit('command', {
      type: 'command',
      rule: this.id,
      command
    })
    const { stdout, stderr, error } = await this.executeChildProcess(command, options)
    if (error) {
      this.error(error.toString())
      success = false
    }
    return await this.processOutput(stdout, stderr) && success
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    return true
  }

  async getOutput (filePath: string): Promise<?File> {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.outputs.get(filePath)

    if (!file) {
      file = await this.getFile(filePath)
      if (!file) return
      if (!this.outputs.has(filePath)) {
        this.outputs.set(filePath, file)
        this.emit('outputAdded', { type: 'outputAdded', rule: this.id, file: filePath })
      }
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
        this.emit('fileChanged', { type: 'fileChanged', file })
      }
    }
  }

  async getInput (filePath: string): Promise<?File> {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.inputs.get(filePath)

    if (!file) {
      file = await this.getFile(filePath)
      if (!file) return
      if (!this.inputs.has(filePath)) {
        // $FlowIgnore
        await file.addRule(this)
        this.inputs.set(filePath, file)
        this.emit('inputAdded', { type: 'inputAdded', rule: this.id, file: filePath })
      }
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

  async getResolvedInput (filePath: string, reference?: File | string): Promise<?File> {
    const expanded = this.resolvePath(filePath, reference)
    return this.getInput(expanded)
  }

  async getResolvedInputs (filePaths: Array<string>, reference?: File | string): Promise<Array<File>> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getResolvedInput(filePath, reference)
      if (file) files.push(file)
    }

    return files
  }

  async getResolvedOutput (filePath: string, reference?: File | string): Promise<?File> {
    const expanded = this.resolvePath(filePath, reference)
    return this.getOutput(expanded)
  }

  async getResolvedOutputs (filePaths: Array<string>, reference?: File | string): Promise<Array<File>> {
    const files = []

    for (const filePath of filePaths) {
      const file = await this.getResolvedOutput(filePath, reference)
      if (file) files.push(file)
    }

    return files
  }

  async getGlobbedInputs (pattern: string, reference?: File | string): Promise<Array<File>> {
    const files = []
    for (const filePath of await this.globPath(pattern, reference)) {
      const file = await this.getInput(filePath)
      if (file) files.push(file)
    }
    return files
  }

  async getGlobbedOutputs (pattern: string, reference?: File | string): Promise<Array<File>> {
    const files = []
    for (const filePath of await this.globPath(pattern, reference)) {
      const file = await this.getOutput(filePath)
      if (file) files.push(file)
    }
    return files
  }

  constructProcessOptions (): Object {
    const processOptions = {
      cwd: this.rootPath,
      env: Object.assign({}, process.env)
    }

    for (const [name, value] of this.state.getOptions(this.jobName)) {
      if (!name.startsWith('$')) continue
      const envName = (process.platform === 'win32' && name === '$PATH') ? 'Path' : name.substring(1)
      if (Array.isArray(value)) {
        const paths: Array<string> = value.map(filePath => filePath ? this.resolvePath(filePath) : '')

        if (processOptions.env[envName] && paths.length > 0 && paths[paths.length - 1] === '') {
          paths[paths.length - 1] = processOptions.env[envName]
        }

        processOptions.env[envName] = paths.join(path.delimiter)
      } else {
        processOptions.env[envName] = value
      }
    }

    return processOptions
  }

  constructCommand (): Array<string> {
    return []
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
