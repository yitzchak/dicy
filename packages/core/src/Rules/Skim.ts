import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase, RuleDescription } from '../types'

const DISPLAYLINE_PATH: string = '/Applications/Skim.app/Contents/SharedSupport/displayline'

export default class Skim extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['execute'],
    parameters: [
      ['DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript'],
      ['SkimCheck']
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
    const command: string[] = [DISPLAYLINE_PATH, '-b', '-r']

    if (this.options.openInBackground) {
      command.push('-g')
    }

    command.push(this.options.sourceLine.toString(), '{{$FILEPATH_0}}')

    if (this.options.sourcePath) {
      command.push(path.resolve(this.rootPath, this.options.sourcePath))
    }

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'warning'
    }
  }
}
