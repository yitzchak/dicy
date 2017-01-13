/* @flow */

import BuildState from './BuildState'
import File from './File'

export default class Rule {
  buildState: BuildState
  id: string
  parameters: Array<File>
  inputs: Map<string, File> = new Map()
  outputs: Map<string, File> = new Map()
  timeStamp: number
  needsEvaluation: boolean = false

  constructor (buildState: BuildState, ...parameters: Array<File>) {
    this.buildState = buildState
    this.parameters = parameters
    this.id = `${this.constructor.name}(${parameters.map(file => file.normalizedFilePath).join()})`
    for (const file of parameters) {
      this.inputs.set(file.normalizedFilePath, file)
      file.addRule(this)
    }
  }

  get firstParameter () {
    if (this.parameters.length === 0) return undefined
    return this.parameters[0]
  }

  async evaluate () {}

  async getOutput (filePath: string) {
    filePath = this.buildState.normalizePath(filePath)
    let file: ?File = this.outputs.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath)
      this.outputs.set(filePath, file)
    }

    return file
  }

  async addOutputs (filePaths: Array<string>) {
    for (const filePath of filePaths) {
      await this.getOutput(filePath)
    }
  }

  async getInput (filePath: string) {
    filePath = this.buildState.normalizePath(filePath)
    let file: ?File = this.inputs.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath)
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
}
