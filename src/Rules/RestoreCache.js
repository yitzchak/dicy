/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class RestoreCache extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static commands: Set<Command> = new Set(['report'])
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true

  async run () {
    for (const filePath in this.buildState.cache.files) {
      await this.getOutput(filePath)
    }
    return true
  }
}
