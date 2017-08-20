/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, CommandOptions, Phase } from '../types'

export default class DviToPs extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to PS using dvips.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    const outputFormat = state.getOption('outputFormat', jobName)
    const intermediatePostScript = state.getOption('intermediatePostScript', jobName)

    // Only apply if output format is ps or intermediate PostScript generation
    // is on.
    return outputFormat === 'ps' || (outputFormat === 'pdf' && !!intermediatePostScript)
  }

  async initialize () {
    // Zap the previous target since we are building a ps
    await this.replaceResolvedTarget('$FILEPATH_0', '$DIR_0/$NAME_0.ps')
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'dvips',
        '-o',
        '{{$DIR_0/$NAME_0.ps}}',
        '{{$FILEPATH_0}}'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.ps']
    }
  }
}
