/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class RestoreCache extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static commands: Set<Command> = new Set(['graph', 'report'])
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Restores file information from the cache for the graph and report command.'

  async run () {
    if (this.buildState.cache && this.buildState.cache.files) {
      for (const filePath in this.buildState.cache.files) {
        await this.getFile(filePath)
      }
    }
    return true
  }
}
