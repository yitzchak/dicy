import File from '../File'
import Rule from '../Rule'

import { Action, CommandOptions } from '../types'

export default class MetaPost extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['MetaPost'])]
  static description: string = 'Runs MetaPost on produced MetaPost files.'

  async getFileActions (file: File): Promise<Action[]> {
    // ParsedFileListing triggers updateDependencies, all others trigger run.
    return [file.type === 'ParsedFileListing' ? 'updateDependencies' : 'run']
  }

  constructCommand (): CommandOptions {
    // Force the same error options as LaTeX and capture the file listing.
    return {
      args: [
        'mpost',
        '-file-line-error',
        '-interaction=batchmode',
        '-recorder',
        '{{$BASE_0}}'
      ],
      cd: '$ROOTDIR_0',
      severity: 'error',
      inputs: ['$DIR_0/$NAME_0.fls-ParsedFileListing'],
      outputs: ['$DIR_0/$NAME_0.fls', '$DIR_0/$NAME_0.log']
    }
  }
}
