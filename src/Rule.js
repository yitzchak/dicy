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

  getOutputFile (filePath: string) {
    console.log(`Output file ${filePath}`)
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
    console.log(`Input file ${filePath}`)
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
