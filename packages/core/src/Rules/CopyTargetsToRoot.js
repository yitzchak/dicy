/* @flow */

import path from 'path'

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, OptionsInterface, Phase } from '../types'

export default class CopyTargetsToRoot extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['*'])]
  static description: string = 'Copy targets to root directory.'
  static alwaysEvaluate: boolean = true

  static async appliesToParameters (state: State, command: Command, phase: Phase, options: OptionsInterface, ...parameters: Array<File>): Promise<boolean> {
    return !!options.copyTargetsToRoot &&
      parameters.every(file => !file.virtual && state.targets.has(file.filePath) && path.dirname(file.filePath) !== '.')
  }

  async initialize () {
    // Remove the old target and replace with the new one.
    this.removeTarget(this.firstParameter.filePath)
    await this.addResolvedTarget('$BASE_0')
  }

  async run () {
    // Copy the target to it's new location and add the result as an output.
    const filePath = this.resolvePath('$ROOTDIR/$BASE_0')
    await this.firstParameter.copy(filePath)
    await this.getOutput(filePath)
    return true
  }
}
