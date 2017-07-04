/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, CommandOptions, Phase } from '../types'

export default class DviToPdf extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to PDF using (x)dvipdfm(x).'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    const appliesToFile = await super.appliesToFile(state, command, phase, jobName, file)
    return state.getOption('outputFormat', jobName) === 'pdf' && appliesToFile
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'xdvipdfmx',
        '-o',
        this.resolvePath('$DIR_0/$NAME_0.pdf'),
        this.firstParameter.filePath
      ],
      cd: '$ROOTDIR',
      severity: 'error'
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$DIR_0/$NAME_0.pdf')
    return true
  }
}
