/* @flow */

import Rule from './Rule'

export default class File {
  filePath: string
  timeStamp: number
  rules: Array<Rule> = []

  constructor (filePath: string) {
    this.filePath = filePath
  }

  addRule (rule: Rule) {
    this.rules.push(rule)
  }
}
