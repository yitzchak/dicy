/* @flow */

import Rule from '../Rule'

import type { Command } from '../types'

export default class ApplySourceMaps extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set(['ParsedSourceMap']),
    new Set([
      'ParsedAsymptoteLog',
      'ParsedBiberLog',
      'ParsedBibTeXLog',
      'ParsedLaTeXLog',
      'ParsedMakeIndexLog'
    ])
  ]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Applies source maps to log files.'

  async run () {
    return true
  }
}
