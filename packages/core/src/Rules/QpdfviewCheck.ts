import { Command } from '@dicy/types'

import Rule from '../Rule'
import { CommandOptions, Phase } from '../types'

export default class QpdfviewCheck extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Check for availability of qpdfview.'

  constructCommand (): CommandOptions {
    return {
      command: 'qpdfview --help',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-QpdfviewCheck'
    }
  }
}
