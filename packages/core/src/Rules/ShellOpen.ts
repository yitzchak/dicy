import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'

export default class ShellOpen extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set([
    'DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript',
    'ScalableVectorGraphics'
  ])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using Windows shell open.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'win32' &&
      parameters.every(file => !file.virtual && consumer.isOutputTarget(file))
  }

  get group (): Group | undefined {
    return 'opener'
  }

  constructCommand (): CommandOptions {
    return {
      command: ['start', '{{$FILEPATH_0}}'],
      cd: '$ROOTDIR',
      severity: 'warning'
    }
  }
}
