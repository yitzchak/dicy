import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase, CommandOptions, RuleDescription } from '../types'

export default class PdfToPs extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['PortableDocumentFormat']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if output format is ps
    return consumer.options.outputFormat === 'ps'
  }

  constructCommand (): CommandOptions {
    return {
      command: [
        'pdf2ps',
        '{{$FILEPATH_0}}',
        '{{$DIR_0/$NAME_0.ps}}'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: [{ file: '$FILEPATH_0', type: 'target' }],
      outputs: [{ file: '$DIR_0/$NAME_0.ps', type: 'target' }]
    }
  }
}
