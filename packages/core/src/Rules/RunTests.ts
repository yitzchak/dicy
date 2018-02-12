import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase, RuleDescription } from '../types'

export default class RunTests extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['test'],
    phases: ['execute']
  }]
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return !!consumer.options.tests && consumer.options.tests.length > 0
  }

  async run (): Promise<boolean> {
    const commands: string[] = this.options.tests || []
    let result: boolean = true

    for (const command of commands) {
      try {
        await this.executeCommand({ command, cd: '$ROOTDIR' })
        this.info(`Test of \`${command}\` succeeded.`, 'test')
      } catch (error) {
        this.error(`Test of \`${command}\` failed.`, 'test')
        result = false
      }
    }

    return result
  }
}
