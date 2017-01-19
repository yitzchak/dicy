/* @flow */

import Rule from '../Rule'

export default class ParseLaTeXMagic extends Rule {
  static phases: Set<string> = new Set(['initialize'])
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static priority: number = 0

  async evaluate () {
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

    Object.assign(this.buildState.options, magic)

    return true
  }
}
