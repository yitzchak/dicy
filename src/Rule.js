/* @flow */

import BuildState from './BuildState'
import File from './File'

export default class Rule {
  buildState: BuildState
  inputFiles: Map<string, File> = new Map()
  outputFiles: Map<string, File> = new Map()
  timeStamp: number
  needsEvaluation: boolean = true

  constructor (buildState: BuildState) {
    this.buildState = buildState
  }

  async evaluate () {}

  async getOutputFile (filePath: string) {
    let file: ?File = this.outputFiles.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath)
      this.outputFiles.set(filePath, file)
    }

    return file
  }

  addOutputFiles (filePaths: Array<string>) {
    return Promise.all(filePaths.map(filePath => this.getOutputFile(filePath)))
  }

  async getInputFile (filePath: string) {
    let file: ?File = this.inputFiles.get(filePath)

    if (!file) {
      file = await this.buildState.getFile(filePath)
      file.addRule(this)
      this.inputFiles.set(filePath, file)
    }

    return file
  }

  addInputFiles (filePaths: Array<string>) {
    return Promise.all(filePaths.forEach(filePath => this.getInputFile(filePath)))
  }
}
