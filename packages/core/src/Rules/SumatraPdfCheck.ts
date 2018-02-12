import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase, RuleDescription } from '../types'

export default class SumatraPdfCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

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
