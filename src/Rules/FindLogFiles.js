/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class FindLogFiles extends Rule {
  static commands: Set<Command> = new Set(['build', 'report'])
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Find preexisting log files.'

  async run () {
    await this.getGlobbedFiles(':outdir/:job.@(log|*lg)')
    return true
  }
}
