import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Action, CommandOptions, ParsedLog, Phase } from '../types'

export default class Metys extends Rule {
  static parameterTypes: Set<string>[] = [new Set([
    'RMarkdown',
    'PythonMarkdown',
    'RNoWeb',
    'PythonNoWeb',
    'TexMetys',
    'TexNoWeb'
  ])]
  static description: string = 'Run metys.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return parameters.some(parameter => (consumer.options.weaveEngine === 'metys' || parameter.type === 'TexMetys') && parameter.filePath === consumer.filePath)
  }

  async getFileActions (file: File): Promise<Action[]> {
    // ParsedMetysStdOut triggers updateDependencies, all others trigger run.
    return [file.type === 'ParsedMetysStdOut' ? 'updateDependencies' : 'run']
  }

  constructCommand (): CommandOptions {
    /* eslint no-template-curly-in-string: 0 */
    return {
      args: ['metys', '{{$BASE_0}}'],
      cd: '$ROOTDIR_0',
      severity: 'error',
      inputs: [{ file: '$DIR_0/$NAME_0.log-ParsedMetysStdOut' }],
      stdout: '$DIR_0/$NAME_0.log-MetysStdOut'
    }
  }
}
