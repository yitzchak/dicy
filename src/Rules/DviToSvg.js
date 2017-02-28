/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class DviToSvg extends Rule {
  static fileTypes: Set<string> = new Set(['DeviceIndependentFile'])
  static description: string = 'Converts DVI to SVG using dvisvgm.'

  static async appliesToFile (buildState: BuildState, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'svg' &&
      await super.appliesToFile(buildState, command, phase, jobName, file)
  }

  constructCommand () {
    return [
      'dvisvgm',
      '-o',
      this.resolvePath('$dir/$name.svg', this.firstParameter),
      this.firstParameter.filePath
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$dir/$name.svg', this.firstParameter)
    return true
  }
}
