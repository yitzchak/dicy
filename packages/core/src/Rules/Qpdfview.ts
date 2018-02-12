import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase, RuleDescription } from '../types'

export default class Qpdfview extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['execute'],
    parameters: [
      ['PortableDocumentFormat', 'PostScript'],
      ['QpdfviewCheck']
    ]
  }]
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return consumer.isOutputTarget(parameters[0])
  }

  get group (): Group | undefined {
    return 'opener'
  }

  constructCommand (): CommandOptions {
    const sourceHash: string = this.options.sourcePath
      ? `#src:${path.resolve(this.rootPath, this.options.sourcePath)}:${this.options.sourceLine}:${this.options.sourceColumn}`
      : ''
    return {
      command: [
        'qpdfview',
        '--unique',
        `{{$FILEPATH_0}}${sourceHash}`
      ],
      cd: '$ROOTDIR',
      severity: 'warning',
      spawn: true
    }
  }
}
