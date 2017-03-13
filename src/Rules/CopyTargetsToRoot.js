/* @flow */

import path from 'path'

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class CopyTargetsToRoot extends Rule {
  static fileTypes: Set<string> = new Set(['*'])
  static description: string = 'Copy targets to root directory.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return !!state.getOption('outputDirectory', jobName) &&
      !!state.getOption('copyTargetsToRoot', jobName) &&
      state.targets.has(file.filePath) &&
      await super.appliesToFile(state, command, phase, jobName, file)
  }

  async run () {
    for (const input of this.inputs.values()) {
      const filePath = path.resolve(this.rootPath, path.basename(input.filePath))
      await input.copy(filePath)
      this.state.targets.delete(input.filePath)
      this.state.targets.add(filePath)
    }
    return true
  }
}
