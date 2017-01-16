/* @flow */

import BuildState from './BuildState'
import File from './File'

export default class Rule {
  buildState: BuildState
  id: string
  parameters: Array<File> = []
  inputs: Map<string, File> = new Map()
  outputs: Map<string, File> = new Map()
  timeStamp: number
  needsEvaluation: boolean = false
  priority: number = 0

  constructor (buildState: BuildState, ...parameters: Array<File>) {
    this.buildState = buildState
    this.parameters = parameters
    this.id = `${this.constructor.name}(${parameters.map(file => file.normalizedFilePath).join()})`
    for (const file: File of parameters) {
      this.inputs.set(file.normalizedFilePath, file)
      file.addRule(this)
    }
  }

  get firstParameter (): File {
    return this.parameters[0]
  }

  async evaluate () {}

  async getOutput (filePath: string, requireExistance: boolean = true): Promise<?File> {
    filePath = this.buildState.normalizePath(filePath)
    let file: ?File = this.outputs.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath, requireExistance)
      if (!file) return
      this.outputs.set(filePath, file)
    }

    return file
  }

  async addOutputs (filePaths: Array<string>) {
    for (const filePath of filePaths) {
      await this.getOutput(filePath)
    }
  }

  *getTriggers (): Iterable<File> {
    for (const file: File of this.inputs.values()) {
      if (file.hasTriggeredEvaluation) yield file
    }
  }

  async updateOutputs () {
    for (const file: File of this.outputs.values()) {
      await file.update()
    }
  }

  async getInput (filePath: string, requireExistance: boolean = true): Promise<?File> {
    filePath = this.buildState.normalizePath(filePath)
    let file: ?File = this.inputs.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath, requireExistance)
      if (!file) return
      await file.addRule(this)
      this.inputs.set(filePath, file)
    }

    return file
  }

  async addInputs (filePaths: Array<string>) {
    for (const filePath of filePaths) {
      await this.getInput(filePath)
    }
  }

  async addResolvedOutputs (exts: Array<string>, circularDependency: boolean = false) {
    for (const ext of exts) {
      const filePath = this.buildState.resolveOutputPath(ext)
      await this.getOutput(filePath)
      if (circularDependency) {
        await this.getInput(filePath)
      }
    }
  }

}
