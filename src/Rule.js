/* @flow */

import BuildState from './BuildState'
import File from './File'

export default class Rule {
  buildState: BuildState
  id: string
  argumentFiles: Array<File>
  inputFiles: Map<string, File> = new Map()
  outputFiles: Map<string, File> = new Map()
  timeStamp: number
  needsEvaluation: boolean = false

  constructor (buildState: BuildState, ...argumentFiles: Array<File>) {
    this.buildState = buildState
    this.argumentFiles = argumentFiles
    this.id = `${this.constructor.name} ${argumentFiles.map(file => file.normalizedFilePath).join(' ')}`
    for (const file of argumentFiles) {
      this.inputFiles.set(file.normalizedFilePath, file)
      file.addRule(this)
    }
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
