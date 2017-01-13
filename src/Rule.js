/* @flow */

import BuildState from './BuildState'
import File from './File'

export default class Rule {
  buildState: BuildState
  id: string
  inputFiles: Map<string, File> = new Map()
  outputFiles: Map<string, File> = new Map()
  timeStamp: number
  needsEvaluation: boolean = false

  constructor (buildState: BuildState, id: string) {
    this.buildState = buildState
    this.id = id
  }

  async evaluate () {}

  async getOutputFile (filePath: string) {
    filePath = this.buildState.normalizePath(filePath)
    let file: ?File = this.outputFiles.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath)
      this.outputFiles.set(filePath, file)
    }

    return file
  }

  async addOutputFiles (filePaths: Array<string>) {
    for (const filePath of filePaths) {
      await this.getOutputFile(filePath)
    }
  }

  async getInputFile (filePath: string) {
    filePath = this.buildState.normalizePath(filePath)
    let file: ?File = this.inputFiles.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath)
      await file.addRule(this)
      this.inputFiles.set(filePath, file)
    }

    return file
  }

  async addInputFiles (filePaths: Array<string>) {
    for (const filePath of filePaths) {
      await this.getInputFile(filePath)
    }
  }
}
