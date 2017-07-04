/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class LhsToTeX extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LiterateHaskell'])]
  static description: string = 'Runs lhs2TeX on lhs files.'

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$DIR_0/$NAME_0.tex')
    return true
  }

  constructCommand (): CommandOptions {
    const outputPath = this.resolvePath('$DIR_0/$NAME_0.tex')

    return {
      args: ['lhs2TeX', '-o', outputPath, this.firstParameter.filePath],
      cd: '$ROOTDIR',
      severity: 'error'
    }
  }
}
