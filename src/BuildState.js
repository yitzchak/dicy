/* @flow */

import File from './File'
import Rule from './Rule'

export default class BuildState {
  files: Map<string, File> = new Map()
  rules: Array<Rule> = []

  addRule (rule: Rule) {
    console.log(`Add rule ${rule.constructor.name}`)
    this.rules.push(rule)
  }

  getFile (filePath: string): File {
    let file = this.files.get(filePath)

    if (!file) {
      file = new File(filePath)
      this.files.set(filePath, file)
    }

    return file
  }
}
