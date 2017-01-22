/* @flow */

import Rule from '../Rule'

import type { EvaluationTrigger, Phase } from '../types'

export default class AssignJobNames extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static evaluationTrigger: EvaluationTrigger = 'always'

  async evaluate () {
    const jobNames = this.options.jobNames
    if (jobNames) {
      const file = await this.getFile(this.filePath)
      if (file) {
        if (Array.isArray(jobNames)) {
          for (const jobName of jobNames) {
            file.jobNames.add(jobName)
          }
        } else {
          for (const jobName in jobNames) {
            file.jobNames.add(jobName)
          }
        }
      }
    }
    return true
  }
}
