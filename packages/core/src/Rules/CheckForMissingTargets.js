/* @flow */

import Rule from '../Rule'

import type { Phase } from '../types'

export default class CheckForMissingTargets extends Rule {
  static phases: Set<Phase> = new Set(['finalize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Check for missing targets which implies no applicable rules.'

  async run (): Promise<boolean> {
    const files = await this.getTargetFiles()
    const jobName = this.options.jobName

    // If targets found for this job then just return true.
    if ((!jobName && files.length !== 0) ||
      (jobName && files.some(file => file.jobNames.has(jobName)))) return true

    // No targets found so log an error message and cause rule failure.
    const jobText = jobName ? ` with job name of \`${jobName}\`` : ''
    this.error(`No rule produced or was capable of producing a target for main source file \`${this.options.filePath}\`${jobText}.`)

    return false
  }
}
