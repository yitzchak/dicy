/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class RestoreCache extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static commands: Set<Command> = new Set(['report'])
  static phases: Set<Phase> = new Set(['configure'])
  static alwaysEvaluate: boolean = true

  async evaluate () {
    this.actionTrace()
    for (const filePath in this.buildState.cache.files) {
      await this.getOutput(filePath)
    }
    return true
  }
}
