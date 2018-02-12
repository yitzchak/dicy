import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase, RuleDescription } from '../types'

export default class DviToSvg extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['DeviceIndependentFile']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if output format is svg
    return consumer.options.outputFormat === 'svg'
  }

  constructCommand (): CommandOptions {
    return {
      command: [
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
