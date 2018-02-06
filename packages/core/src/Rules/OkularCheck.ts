import { Command } from '@dicy/types'

import Rule from '../Rule'
import { CommandOptions, Phase } from '../types'

export default class OkularCheck extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Check for availability of okular.'

  constructCommand (): CommandOptions {
    return {
      command: process.platform === 'win32'
        ? 'WHERE /Q okular.exe'
        : 'okular --version',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-OkularCheck'
    }
  }
}
