import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase } from '../types'

export default class RunTests extends Rule {
  static commands: Set<Command> = new Set<Command>(['test'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Run tests listed in `tests` options.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return !!consumer.options.tests && consumer.options.tests.length > 0
  }

  async run (): Promise<boolean> {
    const options = this.constructProcessOptions(this.rootPath, false, false, false)
    const commands: string[] = this.options.tests || []

    for (const command of commands) {
      this.info(`Executing \`${command}\``, 'command')
      try {
        await this.executeChildProcess(command, options)
        this.info(`Test of \`${command}\` succeeded.`, 'test')
      } catch (error) {
        this.error(`Test of \`${command}\` failed.`, 'test')
        return false
      }
    }

    return true
  }
}
