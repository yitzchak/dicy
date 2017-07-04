/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class Sage extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['Sage'])]
  static description: string = 'Supports SageTeX by running Sage when needed.'

  constructCommand (): CommandOptions {
    return {
      args: ['sage', this.resolvePath('$BASE_0')],
      cd: '$ROOTDIR_0',
      severity: 'error'
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs([
      '$DIR_0/$NAME_0.sout',
      '$DIR_0/$NAME_0.sage.cmd',
      '$DIR_0/$NAME_0.scmd',
      '$DIR_0/$BASE_0.py'
    ])
    await this.getGlobbedOutputs('$DIR_0/sage-plots-for-$NAME_0.tex/*')
    return true
  }
}
