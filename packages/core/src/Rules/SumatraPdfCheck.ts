import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Action, CommandOptions, Phase, RuleDescription } from '../types'

export default class SumatraPdfCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }, {
    commands: ['discover'],
    phases: ['execute'],
    parameters: [['SumatraPdfDiscovery']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'win32'
  }

  getActions (file?: File): Action[] {
    if (this.command !== 'discover') {
      return this.hasResolvedOutput('$JOB.log-SumatraPdfCheck') ? [] : ['run']
    }

    return this.firstParameter.value.current ? ['run', 'update'] : ['update']
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
