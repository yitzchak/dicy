/* @flow */

import childProcess from 'child_process'
import commandJoin from 'command-join'

import BuildState from './BuildState'
import File from './File'
import BuildStateConsumer from './BuildStateConsumer'

import type { Action, Command, Phase, ResolvePathOptions } from './types'

function execute (command: string, options: Object): Promise<Object> {
  return new Promise((resolve, reject) => {
    // if (process.platform !== 'win32') command = command.replace('$', '\\$')
    childProcess.exec(command, options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr })
    })
  })
}

export default class Rule extends BuildStateConsumer {
  static fileTypes: Set<string> = new Set()
  static phases: Set<Phase> = new Set(['execute'])
  static commands: Set<Command> = new Set(['build'])
  static alwaysEvaluate: boolean = false
  static ignoreJobName: boolean = false
  static description: string = ''

  id: string
  parameters: Array<File> = []
  inputs: Map<string, File> = new Map()
  outputs: Map<string, File> = new Map()
  timeStamp: number
  actions: Map<Action, Set<File>> = new Map()
  success: boolean = true

  static async analyzePhase (buildState: BuildState, jobName: ?string) {
    if (await this.appliesToPhase(buildState, jobName)) {
      const rule = new this(buildState, jobName)
      await rule.initialize()
      if (rule.alwaysEvaluate) rule.addAction()
      return rule
    }
  }

  static async appliesToPhase (buildState: BuildState, jobName: ?string): Promise<boolean> {
    return this.commands.has(buildState.command) &&
      this.phases.has(buildState.phase) &&
      this.fileTypes.size === 0
  }

  static async analyzeFile (buildState: BuildState, jobName: ?string, file: File): Promise<?Rule> {
    if (await this.appliesToFile(buildState, jobName, file)) {
      const rule = new this(buildState, jobName, file)
      await rule.initialize()
      if (rule.alwaysEvaluate) rule.addAction(file)
      return rule
    }
  }

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return this.commands.has(buildState.command) &&
      this.phases.has(buildState.phase) &&
      this.fileTypes.has(file.type) &&
      Array.from(file.rules.values()).every(rule => rule.constructor.name !== this.name || rule.jobName !== jobName)
  }

  constructor (buildState: BuildState, jobName: ?string, ...parameters: Array<File>) {
    super(buildState, jobName)
    this.parameters = parameters
    this.id = buildState.getRuleId(this.constructor.name, jobName, ...parameters)
    for (const file: File of parameters) {
      if (jobName) file.jobNames.add(jobName)
      this.inputs.set(file.normalizedFilePath, file)
      // $FlowIgnore
      file.addRule(this)
    }
  }

  async initialize () {}

  async addInputFileActions (file: File, action: Action = 'run'): Promise<void> {
    if (this.constructor.commands.has(this.command) &&
      this.constructor.phases.has(this.phase) &&
      file.hasBeenUpdated && this.timeStamp < file.timeStamp) {
      this.addAction(file, action)
    }
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

  async preEvaluate (): Promise<void> {}

  async evaluate (action: Action): Promise<boolean> {
    await this.preEvaluate()

    if (!this.actions.has(action)) return true

    this.actionTrace(action)
    this.timeStamp = new Date()
    this.success = (action === 'updateDependencies')
      ? await this.updateDependencies()
      : await this.run()
    this.actions.delete(action)
    await this.updateOutputs()

    return this.success
  }

  async updateDependencies (): Promise<boolean> {
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
    const { stdout, stderr, error } = await execute(command, options)
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

  async getResolvedInput (ext: string, options: ResolvePathOptions = {}): Promise<?File> {
    const filePath = this.resolvePath(ext, options)
    return await this.getInput(filePath)
  }

  async getResolvedInputs (exts: Array<string>, options: ResolvePathOptions = {}): Promise<Array<File>> {
    const files = []

    for (const ext of exts) {
      const file = await this.getResolvedInput(ext, options)
      if (file) files.push(file)
    }

    return files
  }

  async getResolvedOutput (ext: string, options: ResolvePathOptions = {}): Promise<?File> {
    const filePath = this.resolvePath(ext, options)
    return await this.getOutput(filePath)
  }

  async getResolvedOutputs (exts: Array<string>, options: ResolvePathOptions = {}): Promise<Array<File>> {
    const files = []

    for (const ext of exts) {
      const file = await this.getResolvedOutput(ext, options)
      if (file) files.push(file)
    }

    return files
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.rootPath,
      env: Object.assign({}, process.env)
    }
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
      triggers: files ? Array.from(files).map(file => file.normalizedFilePath) : []
    })
  }
}
