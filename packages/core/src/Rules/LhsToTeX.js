/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class LhsToTeX extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LiterateHaskell'])]
  static description: string = 'Runs lhs2TeX on lhs files.'

  constructCommand (): CommandOptions {
    return {
      args: ['lhs2TeX', '-o', '$DIR_0/$NAME_0.tex', '$DIR_0/$BASE_0'],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.tex']
    }
  }
}
