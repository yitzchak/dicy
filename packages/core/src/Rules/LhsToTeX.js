/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class LhsToTeX extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set([
    'LiterateHaskell',
    'LiterateAgda'
  ])]
  static description: string = 'Runs lhs2TeX on lhs or lagda files.'

  constructCommand (): CommandOptions {
    const args = ['lhs2TeX']

    if (this.firstParameter.type === 'LiterateAgda') {
      args.push('--agda')
    }

    args.push('-o', '$DIR_0/$NAME_0.tex', '$DIR_0/$BASE_0')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.tex']
    }
  }
}
