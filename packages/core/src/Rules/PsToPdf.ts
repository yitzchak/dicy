import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase, CommandOptions, RuleDescription } from '../types'

export default class PsToPdf extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['PostScript']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if output format is pdf
    return consumer.options.outputFormat === 'pdf'
  }

  constructCommand (): CommandOptions {
    return {
      command: [
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
