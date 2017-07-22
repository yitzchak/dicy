/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class MakeGlossaries extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['GlossaryControlFile'])]
  static description: string = 'Runs makeglossaries on any glossary files generated.'

  async initialize (): Promise<void> {
    await this.getResolvedInputs(['$DIR_0/$NAME_0.acn', '$DIR_0/$NAME_0.ist'])
  }

  constructCommand (): CommandOptions {
    const { dir, name } = path.parse(this.firstParameter.filePath)
    const args = ['makeglossaries']

    // Only push the -d option if needed.
    if (dir) args.push('-d', dir)
    args.push(name)

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [
        '$DIR_0/$NAME_0.acr',
        '$DIR_0/$NAME_0.alg',
        '$DIR_0/$NAME_0.gls',
        '$DIR_0/$NAME_0.glg'
      ]
    }
  }
}
