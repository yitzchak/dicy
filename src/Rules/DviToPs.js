/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class DviToPs extends Rule {
  static fileTypes: Set<string> = new Set(['DeviceIndependentFile'])
  static description: string = 'Converts DVI to PS using dvips.'

  static async appliesToFile (buildState: BuildState, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps' &&
      await super.appliesToFile(buildState, command, phase, jobName, file)
  }

  constructCommand () {
    return [
      'dvips',
      '-o',
      this.resolvePath('$dir/$name.ps', this.firstParameter),
      this.firstParameter.filePath
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$dir/$name.ps', this.firstParameter)
    return true
  }
}
