import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase } from '../types'

export default class DviToPs extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to PS using dvips.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if output format is ps or intermediate PostScript generation
    // is on.
    return consumer.options.outputFormat === 'ps' ||
      (consumer.options.outputFormat === 'pdf' && !!consumer.options.intermediatePostScript)
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
      inputs: [{ file: '$FILEPATH_0', type: 'target' }],
      outputs: [{ file: '$DIR_0/$NAME_0.ps', type: 'target' }]
    }
  }
}
