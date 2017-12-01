import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase } from '../types'

export default class DviToSvg extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to SVG using dvisvgm.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if output format is svg
    return consumer.options.outputFormat === 'svg'
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
      inputs: [{ file: '$FILEPATH_0', type: 'target' }],
      outputs: [{ file: '$DIR_0/$NAME_0.svg', type: 'target' }]
    }
  }
}
