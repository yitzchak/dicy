import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase, RuleDescription } from '../types'

export default class OkularCandidates extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['discover'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'win32'
  }

  async run (): Promise<boolean> {
    await this.createResolvedOutput('$JOB.log-OkularDiscovery', {
      candidates: [
        '$PATH',
        '$PATH;${ProgramFiles(x86)}\\Okular\\bin'
      ]
    })

    return true
  }
}
