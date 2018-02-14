import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Action, CommandOptions, Phase, RuleDescription } from '../types'

export default class SkimCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }, {
    commands: ['discover'],
    phases: ['execute'],
    parameters: [['SkimDiscovery']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'darwin'
  }

  getActions (file?: File): Action[] {
    if (this.command !== 'discover') {
      return this.hasResolvedOutput('$JOB.log-SkimCheck') ? [] : ['run']
    }

    return this.firstParameter.value.current ? ['run', 'update'] : ['update']
  }

  constructCommand (): CommandOptions {
    return {
      command: 'displayline -h',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-SkimCheck'
    }
  }
}
