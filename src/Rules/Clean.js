/* @flow */

import micromatch from 'micromatch'

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class Clean extends Rule {
  static commands: Set<Command> = new Set(['clean'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Clean up a previous build.'

  async run () {
    const deepClean: boolean = this.options.deepClean
    const cleanPatterns: Array<Function> = this.options.cleanPatterns.map(pattern => micromatch.matcher(pattern))
    const files: Set<File> = new Set()

    for (const rule of this.rules) {
      if (rule.jobName === this.jobName) {
        for (const file of rule.outputs.values()) files.add(file)
      }
    }

    for (const file of files.values()) {
      if (!file.virtual &&
        (deepClean || cleanPatterns.some(pattern => pattern(file.normalizedFilePath)))) {
        await this.buildState.deleteFile(file)
      }
    }

    return true
  }
}
