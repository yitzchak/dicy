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

    if (!files.some(file => (!jobName && file.jobNames.size === 0) ||
      (jobName && file.jobNames.has(jobName)))) {
      const jobText = jobName ? ` with job name of \`${jobName}\`` : ''
      this.error(`No rule capable of producing a target for main source file \`${this.options.filePath}\`${jobText}.`)
    }

    return true
  }
}
