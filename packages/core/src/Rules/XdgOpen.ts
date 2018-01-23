import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'

export default class XdgOpen extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set([
    'DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript',
    'ScalableVectorGraphics'
  ])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using xdg-open.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'linux' &&
      parameters.every(file => !file.virtual && consumer.isOutputTarget(file))
  }

  get group (): Group | undefined {
    return 'opener'
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'xdg-open',
        '{{$FILEPATH_0}}'
      ],
      cd: '$ROOTDIR',
      severity: 'warning'
    }
  }
}
