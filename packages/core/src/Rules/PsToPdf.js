/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase, CommandOptions, OptionsInterface } from '../types'

export default class PsToPdf extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['PostScript'])]
  static description: string = 'Converts PS to PDF using ps2pdf.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, options: OptionsInterface, ...parameters: Array<File>): Promise<boolean> {
    // Only apply if output format is pdf
    return options.outputFormat === 'pdf'
  }

  async initialize () {
    // Zap the previous target since we are building a pdf
    await this.replaceResolvedTarget('$FILEPATH_0', '$DIR_0/$NAME_0.pdf')
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'ps2pdf',
        '{{$FILEPATH_0}}',
        '{{$DIR_0/$NAME_0.pdf}}'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.pdf']
    }
  }
}
