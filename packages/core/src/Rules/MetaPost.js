/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class MetaPost extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['MetaPost'])]
  static description: string = 'Runs MetaPost on produced MetaPost files.'

  constructCommand (): CommandOptions {
    return {
      args: [
        'mpost',
        this.resolvePath('$BASE_0')
      ],
      cd: '$ROOTDIR_0',
      severity: 'error'
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getGlobbedOutputs('$DIR_0/$NAME_0.+([0-9])')
    await this.getResolvedOutputs(['$DIR_0/$NAME_0.log', '$DIR_0/$NAME_0.t1'])
    return true
  }
}
