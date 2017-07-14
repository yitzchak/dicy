/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, Phase } from '../types'

export default class MetaPost extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['MetaPost'])]
  static description: string = 'Runs MetaPost on produced MetaPost files.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return await super.appliesToFile(state, command, phase, jobName, file) &&
      // This is an awful hack. Do we need to look for end/bye?
      !path.isAbsolute(file.filePath)
  }

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
