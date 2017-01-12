/* @flow */

import File from './File'
import Rule from './Rule'

export default class BuildState {
  files: Map<string, File> = new Map()
  rules: Array<Rule> = []
  options: Object = {}

  constructor (options = {}) {
    Object.assign(this.options, options)
  }

  static async create (filePath: string, options = {}) {
    const buildState = new BuildState()

    await buildState.getFile(filePath)

    return buildState
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
}
