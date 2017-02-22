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
    const generatedFiles: Set<File> = new Set()
    const files: Set<File> = new Set()

    for (const rule of this.rules) {
      if (rule.jobName === this.jobName) {
        for (const file of rule.outputs.values()) {
          if (file.virtual) continue
          if (deepClean) {
            files.add(file)
          } else {
            generatedFiles.add(file)
          }
        }
      }
    }

    for (const pattern of this.options.cleanPatterns) {
      if (/^[/\\]/.test(pattern)) {
        for (const file of await this.getGlobbedFiles(pattern.substring(1))) {
          files.add(file)
        }
      } else if (!deepClean && generatedFiles.size !== 0) {
        const isMatch = micromatch.matcher(this.resolvePath(pattern), { dot: true })
        for (const file of generatedFiles.values()) {
          if (isMatch(file.filePath)) {
            files.add(file)
          }
        }
      }
    }

    for (const file of files.values()) {
      await this.buildState.deleteFile(file, this.jobName)
    }

    return true
  }
}
