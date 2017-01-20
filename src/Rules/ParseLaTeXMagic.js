/* @flow */

import Rule from '../Rule'

import type { Phase } from '../types'

export default class ParseLaTeXMagic extends Rule {
  static phases: Set<Phase> = new Set(['configure'])
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static priority: number = 0

  async evaluate () {
    const parsedFile = await this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedLaTeXMagic`)
    if (!parsedFile) return false
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

    parsedFile.value = magic

    return true
  }
}
