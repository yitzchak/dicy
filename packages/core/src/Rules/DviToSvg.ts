import State from '../State'
import File from '../File'
import Rule from '../Rule'

import { Command, CommandOptions, OptionsInterface, Phase } from '../types'

export default class DviToSvg extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to SVG using dvisvgm.'

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: Array<File> = []): Promise<boolean> {
    // Only apply if output format is svg
    return options.outputFormat === 'svg'
  }

  async initialize () {
    // Zap the previous target since we are building a svg
    await this.replaceResolvedTarget('$FILEPATH_0', '$DIR_0/$NAME_0.svg')
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'dvisvgm',
        '-o',
        '{{$DIR_0/$NAME_0.svg}}',
        '{{$FILEPATH_0}}'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.svg']
    }
  }
}
