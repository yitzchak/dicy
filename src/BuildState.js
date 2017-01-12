/* @flow */

import fs from 'mz/fs'
import path from 'path'
import yaml from 'js-yaml'
import File from './File'
import Rule from './Rule'

export default class BuildState {
  filePath: string
  files: Map<string, File> = new Map()
  rules: Array<Rule> = []
  options: Object = {}

  constructor (filePath: string, options: Object = {}) {
    this.filePath = filePath
    Object.assign(this.options, options)
  }

  static async create (filePath: string, options: Object = {}) {
    const buildState = new BuildState(filePath, options)

    await buildState.getFile(filePath)

    return buildState
  }

  resolveOutputPath (ext: string) {
    let { dir, name } = path.parse(this.filePath)

    if (this.options.jobName) {
      name = this.options.jobName
    }

    if (this.options.outputDirectory) {
      dir = path.resolve(dir, this.options.outputDirectory)
    }

    return path.format({ dir, name, ext })
  }

  addRule (rule: Rule) {
    console.log(`Add rule ${rule.constructor.name}`)
    this.rules.push(rule)
  }

  async getFile (filePath: string): File {
    let file: ?File = this.files.get(filePath)

    if (!file) {
      file = await File.create(filePath)
      this.files.set(filePath, file)
    }

    return file
  }

  setOptions (options: Object) {
    Object.assign(this.options, options)
  }

  async save () {
    const statePath = this.resolveOutputPath('.yaml')
    const state = {
      filePath: this.filePath,
      options: this.options,
      files: {},
      rules: []
    }

    for (const file of this.files.values()) {
      state.files[file.filePath] = {
        timeStamp: file.timeStamp,
        hash: file.hash
      }
    }

    for (const rule of this.rules) {
      state.rules.push({
        name: rule.constructor.name,
        timeStamp: rule.timeStamp,
        inputFiles: Array.from(rule.inputFiles.keys()),
        outputFiles: Array.from(rule.outputFiles.keys())
      })
    }

    const serialized = yaml.safeDump(state)
    await fs.writeFile(statePath, serialized)
  }
}
