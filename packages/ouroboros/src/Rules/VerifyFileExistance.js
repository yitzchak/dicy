/* @flow */

import Rule from '../Rule'

import type { Command } from '../types'

export default class VerifyFileExistance extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Verifies that all files still exist.'

  async run () {
    const files = []

    for (const file of this.files) {
      if (!file.virtual && !await file.canRead()) files.push(file)
    }

    for (const jobName of this.options.jobNames) {
      for (const file of files) {
        this.state.deleteFile(file, jobName, false)
      }
    }

    return true
  }
}
