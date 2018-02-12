import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase, RuleDescription } from '../types'

export default class XdgOpen extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['execute'],
    parameters: [[
      'DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript',
      'ScalableVectorGraphics'
    ]]
  }]
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'linux' && consumer.isOutputTarget(parameters[0])
  }

  get group (): Group | undefined {
    return 'opener'
  }

  constructCommand (): CommandOptions {
    return {
      command: [
        'xdg-open',
        '{{$FILEPATH_0}}'
      ],
      cd: '$ROOTDIR',
      severity: 'warning'
    }
  }
}
