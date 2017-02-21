/* @flow */

import Rule from '../Rule'

import type { Command } from '../types'

export default class ParseLaTeXMagic extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static fileTypes: Set<string> = new Set(['Knitr', 'LaTeX', 'LiterateHaskell'])
  static description: string = 'Parses Magic comments in LaTeX or knitr documents.'

  async run () {
    const output = await this.getResolvedOutput(':dir/:base-ParsedLaTeXMagic', this.firstParameter)
    const magic = {}

    await this.firstParameter.parse([{
      names: ['name', 'value'],
      patterns: [/^%\s*!T[eE]X\s+(\w+)\s*=\s*(.*)$/],
      evaluate: (reference, groups) => {
        if (groups.name === 'jobNames') {
          magic[groups.name] = groups.value.trim().split(/\s*,\s*/)
        } else {
          magic[groups.name] = groups.value.trim()
        }
      }
    }])

    if (output) output.value = magic

    return true
  }
}
