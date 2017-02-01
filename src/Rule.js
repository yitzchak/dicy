/* @flow */

import childProcess from 'child_process'
import commandJoin from 'command-join'

import BuildState from './BuildState'
import File from './File'
import BuildStateConsumer from './BuildStateConsumer'

import type { Action, Command, Phase, ResolvePathOptions } from './types'

function execute (command: string, options: Object): Promise<Object> {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') command = command.replace('$', '\\$')
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
      this.fileTypes.has(file.type)
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
    if (file.hasBeenUpdated && this.timeStamp < file.timeStamp) {
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

  async evaluate (): Promise<boolean> {
    let success = true

    this.timeStamp = new Date()
    await this.preEvaluate()

    if (this.actions.has('updateDependencies')) {
      this.actionTrace('updateDependencies')
      success = await this.updateDependencies() && success
    }

    if (this.actions.has('run')) {
      this.actionTrace('run')
      success = await this.run() && success
    }

    this.actions.clear()
    await this.updateOutputs()
    this.success = success
    const rules = this.buildState.commands.get(this.buildState.command)
    if (rules) {
      rules.push(this.id)
    } else {
      this.buildState.commands.set(this.buildState.command, [this.id])
    }

    return success
  }

  async updateDependencies (): Promise<boolean> {
    return true
  }

  async run (): Promise<boolean> {
    let success: boolean = true
    const options = this.constructProcessOptions()
    const command = commandJoin(this.constructCommand())

    this.log({
      severity: 'info',
      name: this.id,
      text: `Executing \`${command}\``
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
      this.outputs.set(filePath, file)
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
      await file.update()
    }
  }

  async getInput (filePath: string): Promise<?File> {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.inputs.get(filePath)

    if (!file) {
      file = await this.getFile(filePath)
      if (!file) return
      // $FlowIgnore
      await file.addRule(this)
      this.inputs.set(filePath, file)
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
    const triggers = files ? Array.from(files.values()).map(file => file.normalizedFilePath).join(', ') : ''
    const triggerText = triggers ? ` triggered by updates to ${triggers}` : ''
    this.log({
      severity: 'trace',
      name: this.id,
      text: `Evaluating ${action} action${triggerText}`
    })
  }
}
