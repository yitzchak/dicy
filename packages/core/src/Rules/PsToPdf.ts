import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase, CommandOptions } from '../types'

export default class PsToPdf extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['PostScript'])]
  static description: string = 'Converts PS to PDF using ps2pdf.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if output format is pdf
    return consumer.options.outputFormat === 'pdf'
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
      inputs: [{ file: '$FILEPATH_0', type: 'target' }],
      outputs: [{ file: '$DIR_0/$NAME_0.pdf', type: 'target' }]
    }
  }
}
