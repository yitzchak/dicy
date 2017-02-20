/* @flow */

import _ from 'lodash'
import fastGlob from 'fast-glob'
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
    const [filePatterns, generatedPatterns] = _.partition(this.options.cleanPatterns, pattern => /^[/\\]/)

    const cleanPatterns: Array<Function> = generatedPatterns.map(pattern => micromatch.matcher(pattern))
    const candidatefiles: Set<File> = new Set()
    const files: Set<File> = new Set()

    for (const filePath of await fastGlob(filePatterns, { cwd: this.rootPath })) {
      const file = await this.getFile(filePath)
      if (file) files.add(file)
    }

    for (const rule of this.rules) {
      if (rule.jobName === this.jobName) {
        for (const file of rule.outputs.values()) candidatefiles.add(file)
      }
    }

    for (const file of candidatefiles.values()) {
      if (!file.virtual &&
        (deepClean || cleanPatterns.some(pattern => pattern(file.normalizedFilePath)))) {
        files.add(file)
      }
    }

    for (const file of files.values()) {
      await this.buildState.deleteFile(file, this.jobName)
    }

    return true
  }
}
