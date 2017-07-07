/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class AssignJobNames extends Rule {
  static phases: Set<Phase> = new Set(['finalize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Assign job names to initial source file.'

  async run (): Promise<boolean> {
    // Get the source file associated with this job.
    const file = await this.getFile(this.options.filePath)

    if (file && this.jobName) {
      // If the file exists and we have a job name then add it.
      file.jobNames.add(this.jobName)
    }

    return true
  }
}
