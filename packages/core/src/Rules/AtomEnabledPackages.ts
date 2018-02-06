import { Command } from '@dicy/types'

import Rule from '../Rule'
import { CommandOptions, Phase } from '../types'

export default class AtomEnabledPackages extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Get list of Atom\'s enabled packages.'

  constructCommand (): CommandOptions {
    return {
      command: ['apm', 'list', '--installed', '--packages', '--enabled', '--bare'],
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-AtomEnabledPackages'
    }
  }
}
