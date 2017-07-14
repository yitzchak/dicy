/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Action, CommandOptions } from '../types'

export default class MetaPost extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['MetaPost'])]
  static description: string = 'Runs MetaPost on produced MetaPost files.'

  async initialize () {
    await this.getResolvedInput('$DIR_0/$NAME_0.fls-ParsedFileListing')
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    // ParsedFileListing triggers updateDependencies, all others trigger run.
    return [file.type === 'ParsedFileListing' ? 'updateDependencies' : 'run']
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'mpost',
        '-file-line-error',
        '-interaction=batchmode',
        '-recorder',
        '$BASE_0'
      ],
      cd: '$ROOTDIR_0',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.fls', '$DIR_0/$NAME_0.log']
    }
  }
}
