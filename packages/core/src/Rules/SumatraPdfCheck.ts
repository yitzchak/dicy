import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase } from '../types'

export default class SumatraPdfCheck extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Check for availability of Sumatra PDF.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'win32'
  }

  constructCommand (): CommandOptions {
    return {
      command: 'WHERE /Q SumatraPDF.exe',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-SumatraPdfCheck'
    }
  }
}
