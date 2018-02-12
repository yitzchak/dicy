import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase, RuleDescription } from '../types'

const DISPLAYLINE_PATH: string = '/Applications/Skim.app/Contents/SharedSupport/displayline'

export default class SkimCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'darwin'
  }

  constructCommand (): CommandOptions {
    return {
      command: [DISPLAYLINE_PATH, '-h'],
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-SkimCheck'
    }
  }
}
