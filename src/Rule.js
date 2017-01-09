/* @flow */

import BuildState from './BuildState'
import File from './File'

export default class Rule {
  buildState: BuildState
  inputFiles: Map<string, File> = new Map()
  outputFiles: Map<string, File> = new Map()
  timeStamp: number

  constructor (buildState: BuildState, inputPaths: Array<string> = [], outputPaths: Array<string> = []) {
    this.buildState = buildState
    buildState.addRule(this)
    this.addInputFiles(inputPaths)
    this.addOutputFiles(outputPaths)
  }

  async evaluate () {}

  getOutputFile (filePath: string) {
    let file = this.outputFiles.get(filePath)

    if (!file) {
      file = this.buildState.getFile(filePath)
      this.outputFiles.set(filePath, file)
    }

    return file
  }

  addOutputFiles (filePaths: Array<string>) {
    filePaths.forEach(filePath => this.getOutputFile(filePath))
  }

  getInputFile (filePath: string) {
    let file = this.inputFiles.get(filePath)

    if (!file) {
      file = this.buildState.getFile(filePath)
      file.addRule(this)
      this.inputFiles.set(filePath, file)
    }

    return file
  }

  addInputFiles (filePaths: Array<string>) {
    filePaths.forEach(filePath => this.getInputFile(filePath))
  }
}
