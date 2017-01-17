/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class ParseLaTeXMagic extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])

  constructor (buildState: BuildState, jobName: ?string, ...parameters: Array<File>) {
    super(buildState, jobName, ...parameters)
    this.priority = 200
  }

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

    Object.assign(this.options, magic)

    // this.firstParameter.contents = { magic }
  }
}

export default class ParseLaTeXMagicFactory extends RuleFactory {
  async analyze (file: File, jobName: ?string) {
    if (file.type === 'LaTeX') {
      const rule = new ParseLaTeXMagic(this.buildState, undefined, file)
      await this.buildState.addRule(rule)
    }
  }
}
