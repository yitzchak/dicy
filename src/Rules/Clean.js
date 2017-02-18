/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class Clean extends Rule {
  static commands: Set<Command> = new Set(['clean'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Clean up a previous build.'

  async run () {
    const files: Set<File> = new Set()
    for (const rule of this.buildState.rules.values()) {
      if (rule.jobName === this.jobName) {
        for (const file of rule.outputs.values()) files.add(file)
      }
    }
    console.log(Array(files.values()).map(file => file.normalizedFilePath))
    return true
  }
}
