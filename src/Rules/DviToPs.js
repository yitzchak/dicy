/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class DviToPs extends Rule {
  static fileTypes: Set<string> = new Set(['DeviceIndependentFile'])
  static description: string = 'Converts DVI to PS using dvips.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return state.options.outputFormat === 'ps' &&
      await super.appliesToFile(state, command, phase, jobName, file)
  }

  constructCommand () {
    return [
      'dvips',
      '-o',
      this.resolvePath('$DIR/$NAME.ps', this.firstParameter),
      this.firstParameter.filePath
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$DIR/$NAME.ps', this.firstParameter)
    return true
  }
}
