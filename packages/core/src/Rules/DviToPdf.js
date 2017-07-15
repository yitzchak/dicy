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
    const outputFormat = state.getOption('outputFormat', jobName)
    const intermediatePostScript = state.getOption('intermediatePostScript', jobName)

    return outputFormat === 'pdf' && !intermediatePostScript && appliesToFile
  }

  async initialize () {
    await this.replaceResolvedTarget('$DIR_0/$BASE_0', '$DIR_0/$NAME_0.pdf')
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'xdvipdfmx',
        '-o',
        '$DIR_0/$NAME_0.pdf',
        '$DIR_0/$BASE_0'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.pdf']
    }
  }
}
