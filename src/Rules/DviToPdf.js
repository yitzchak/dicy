/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class DviToPdf extends Rule {
  static fileTypes: Set<string> = new Set(['DeviceIndependentFile'])
  static description: string = 'Converts DVI to PDF using (x)dvipdfm(x).'

  static async appliesToFile (buildState: BuildState, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'pdf' &&
      await super.appliesToFile(buildState, command, phase, jobName, file)
  }

  constructCommand () {
    return [
      'xdvipdfmx',
      '-o',
      this.resolvePath(':dir/:name.pdf', this.firstParameter),
      this.firstParameter.normalizedFilePath
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput(':dir/:name.pdf', this.firstParameter)
    return true
  }
}
