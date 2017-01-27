/* @flow */

import childProcess from 'child_process'

import BuildState from './BuildState'
import File from './File'
import BuildStateConsumer from './BuildStateConsumer'

import type { Command, Phase } from './types'

function execute (command: string, options: Object): Promise<Object> {
  return new Promise((resolve, reject) => {
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
  static exclusive: boolean = false

  id: string
  parameters: Array<File> = []
  inputs: Map<string, File> = new Map()
  outputs: Map<string, File> = new Map()
  timeStamp: number
  actions: Map<string, Set<File>> = new Map()
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

  async addInputFileActions (file: File): Promise<void> {
    if (file.hasBeenUpdated && this.timeStamp < file.timeStamp) {
      this.addAction(file)
    }
  }

  addAction (file: ?File, action: string = 'evaluate'): void {
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

  async preEvaluate (): Promise<boolean> {
    return true
  }

  async evaluate (): Promise<boolean> {
    let success = await this.preEvaluate()

    if (this.actions.has('evaluate')) {
      const options = this.constructProcessOptions()
      const command = this.constructCommand()

      this.info(`Running ${this.id}...`)
      const { stdout, stderr, error } = await execute(command, options)
      if (error) {
        this.error(error.toString())
        success = false
      }
      success = await this.postEvaluate(stdout, stderr) && success
    }

    return success
  }

  async postEvaluate (stdout: string, stderr: string): Promise<boolean> {
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

  getTriggers (): Array<File> {
    const files: Set<File> = new Set()
    for (const actionFiles of this.actions.values()) {
      for (const file of actionFiles.values()) files.add(file)
    }
    return Array.from(files.values())
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

  async getResolvedInput (ext: string): Promise<?File> {
    const filePath = this.resolveOutputPath(ext)
    return await this.getInput(filePath)
  }

  async getResolvedInputs (...exts: Array<string>): Promise<Array<File>> {
    const files = []

    for (const ext of exts) {
      const file = await this.getResolvedInput(ext)
      if (file) files.push(file)
    }

    return files
  }

  async getResolvedOutput (ext: string): Promise<?File> {
    const filePath = this.resolveOutputPath(ext)
    return await this.getOutput(filePath)
  }

  async getResolvedOutputs (...exts: Array<string>): Promise<Array<File>> {
    const files = []

    for (const ext of exts) {
      const file = await this.getResolvedOutput(ext)
      if (file) files.push(file)
    }

    return files
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.rootPath
    }
  }

  constructCommand (): string {
    return ''
  }
}
