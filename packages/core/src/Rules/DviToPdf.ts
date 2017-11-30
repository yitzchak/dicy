import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase } from '../types'

export default class DviToPdf extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to PDF using (x)dvipdfm(x).'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if output format is pdf and intermediate PostScript generation
    // is off.
    return consumer.options.outputFormat === 'pdf' && !consumer.options.intermediatePostScript
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        this.options.dviToPdfEngine,
        '-o',
        '{{$DIR_0/$NAME_0.pdf}}',
        '{{$FILEPATH_0}}'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.pdf'],
      targets: [{
        parent: '$FILEPATH_0',
        filePath: '$DIR_0/$NAME_0.pdf'
      }]
    }
  }
}
