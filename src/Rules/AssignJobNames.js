/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class AssignJobNames extends Rule {
  static phases: Set<Phase> = new Set(['finalize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Assign job names to initial source file.'

  async run () {
    const file = await this.getFile(this.options.filePath)
    if (file && this.jobName) {
      file.jobNames.add(this.jobName)
    }
    return true
  }
}
