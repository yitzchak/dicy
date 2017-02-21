/* @flow */

import fastGlob from 'fast-glob'

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class FindLogFiles extends Rule {
  static commands: Set<Command> = new Set(['build', 'report'])
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Find preexisting log files.'

  async run () {
    const filePattern = this.expandPath(':outdir/:job.@(log|*lg)')
    await this.getFiles(await fastGlob(filePattern, { cwd: this.rootPath, bashNative: [] }))
    return true
  }
}
