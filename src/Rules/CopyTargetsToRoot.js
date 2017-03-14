/* @flow */

import path from 'path'

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class CopyTargetsToRoot extends Rule {
  static fileTypes: Set<string> = new Set(['*'])
  static description: string = 'Copy targets to root directory.'
  static alwaysEvaluate: boolean = true

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return !!state.getOption('copyTargetsToRoot', jobName) &&
      state.targets.has(file.filePath) &&
      path.dirname(file.filePath) !== '.' &&
      await super.appliesToFile(state, command, phase, jobName, file)
  }

  async initialize () {
    this.removeTarget(this.firstParameter.filePath)
    await this.addResolvedTarget('$BASE', this.firstParameter)
  }

  async run () {
    const filePath = this.resolvePath('$ROOTDIR/$BASE', this.firstParameter)
    await this.firstParameter.copy(filePath)
    await this.getOutput(filePath)
    return true
  }
}
