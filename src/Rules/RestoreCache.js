/* @flow */

import Rule from '../Rule'

import type { EvaluationTrigger, Command, Phase } from '../types'

export default class RestoreCache extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static commands: Set<Command> = new Set(['report'])
  static phases: Set<Phase> = new Set(['configure'])
  static evaluationTrigger: EvaluationTrigger = 'always'

  async evaluate () {
    for (const filePath in this.buildState.cache.files) {
      await this.getOutput(filePath)
    }
    return true
  }
}
