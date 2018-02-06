import { Command } from '@dicy/types'

import Rule from '../Rule'
import { CommandOptions, Phase } from '../types'

export default class ZathuraCheck extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Check for availability of zathura.'

  constructCommand (): CommandOptions {
    return {
      command: 'zathura --version',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-ZathuraCheck'
    }
  }
}
