import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'

export default class SumatraPdf extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set(['PortableDocumentFormat'])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using Sumatra PDF.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (process.platform !== 'win32' ||
      parameters.some(file => file.virtual || !consumer.isOutputTarget(file))) {
      return false
    }

    try {
      await consumer.executeCommand({
        command: ['WHERE', '/Q', 'SumatraPDF.exe'],
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