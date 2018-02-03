import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'

const DISPLAYLINE_PATH: string = '/Applications/Skim.app/Contents/SharedSupport/displayline'

export default class Skim extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set([
    'DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript'
  ])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using Skim.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (process.platform !== 'darwin' ||
      parameters.some(file => file.virtual || !consumer.isOutputTarget(file))) {
      return false
    }

    try {
      await consumer.executeCommand({
        command: [DISPLAYLINE_PATH, '-h'],
        cd: '$ROOTDIR',
        severity: 'info'
      })
    } catch (error) {
      return false
    }

    return true
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
