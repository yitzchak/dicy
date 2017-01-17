/* @flow */

import Rule from '../Rule'

export default class ParseLaTeXMagic extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static priority: number = 200

  async evaluate () {
    const magic = {}

    await this.firstParameter.parse([{
      names: ['name', 'value'],
      patterns: [/^%\s*!T[eE]X\s+(\w+)\s*=\s*(.*)$/],
      evaluate: (reference, groups) => {
        if (groups.name === 'jobNames') {
          magic[groups.name] = groups.value.trim().split(/\s*,\s*/)
          for (const jobName of magic[groups.name]) {
            this.firstParameter.jobNames.add(jobName)
          }
        } else {
          magic[groups.name] = groups.value.trim()
        }
      }
    }])

    Object.assign(this.options, magic)

    // this.firstParameter.contents = { magic }
  }
}
