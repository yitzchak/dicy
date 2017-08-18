/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class Pweave extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['PythonNoWeb'])]
  static description: string = 'Runs Pweave on Pnw files.'

  constructCommand (): CommandOptions {
    return {
      args: [
        'pweave',
        '--cache-directory', this.options.pweaveCacheDirectory,
        '--figure-directory', this.options.pweaveFigureDirectory,
        '--format', this.options.pweaveOutputFormat,
        '$DIR_0/$BASE_0'],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.tex']
    }
  }
}
