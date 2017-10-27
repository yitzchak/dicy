/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class AssignJobNames extends Rule {
  static phases: Set<Phase> = new Set(['finalize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Assign job names to initial source file.'

  async run (): Promise<boolean> {
    // Get the source file associated with this job and also make sure there
    // is a Nil file.
    const files = await this.getFiles([this.options.filePath, 'x.y-Nil'])

    if (this.options.jobName) {
      // If we have a job name then add it.
      for (const file of files) {
        file.jobNames.add(this.options.jobName)
      }
    }

    return true
  }
}
