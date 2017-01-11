/* @flow */

import File from './File'
import Rule from './Rule'

export default class BuildState {
  files: Map<string, File> = new Map()
  rules: Array<Rule> = []
  options: Object = {}

  addRule (rule: Rule) {
    console.log(`Add rule ${rule.constructor.name}`)
    this.rules.push(rule)
  }

  async getFile (filePath: string): File {
    let file: ?File = this.files.get(filePath)

    if (!file) {
      file = new File(filePath)
      await file.findType()
      await file.updateTimeStamp()
      await file.updateHash()
      this.files.set(filePath, file)
    }

    return file
  }

  setOptions (options: Object) {
    Object.assign(this.options, options)
  }
}
