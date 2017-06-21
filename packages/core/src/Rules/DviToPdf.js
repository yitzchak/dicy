/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class DviToPdf extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to PDF using (x)dvipdfm(x).'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    const appliesToFile = super.appliesToFile(state, command, phase, jobName, file)
    return state.options.outputFormat === 'pdf' && appliesToFile
  }

  constructCommand () {
    return {
      args: [
        'xdvipdfmx',
        '-o',
        this.resolvePath('$DIR/$NAME.pdf', this.firstParameter),
        this.firstParameter.filePath
      ],
      severity: 'error'
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$DIR/$NAME.pdf', this.firstParameter)
    return true
  }
}
