import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase, RuleDescription } from '../types'

export default class SumatraPdf extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['execute'],
    parameters: [['PortableDocumentFormat'], ['SumatraPdfCheck']]
  }]
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return consumer.isOutputTarget(parameters[0])
  }

  get group (): Group | undefined {
    return 'opener'
  }

  constructCommand (): CommandOptions {
    const command = ['SumatraPDF', '-reuse-instance']

    if (this.options.sourcePath) {
      command.push('-forward-search',
        path.resolve(this.rootPath, this.options.sourcePath),
        this.options.sourceLine.toString())
    }

    // command.push('-inverse-search',
    //   `"\\"${editPath}\\" \\"%f:%l\\""`)

    command.push('{{$FILEPATH_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'warning',
      spawn: true
    }
  }
}
