import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase, RuleDescription } from '../types'

export default class Preview extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['execute'],
    parameters: [['PortableDocumentFormat', 'PostScript']]
  }]
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'darwin' && consumer.isOutputTarget(parameters[0])
  }

  get group (): Group | undefined {
    return 'opener'
  }

  constructCommand (): CommandOptions {
    const command: string[] = ['open', '-a', 'Preview.app']

    if (this.options.openInBackground) {
      command.push('-g')
    }

    command.push('{{$FILEPATH_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'warning'
    }
  }
}
