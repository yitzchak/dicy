/* @flow */

import Rule from '../Rule'

import type { Action } from '../types'

export default class ParseLaTeXAuxilary extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LaTeXAuxilary'])]
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses the aux files produced by all variants of latex.'

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedLaTeXAuxilary')
    if (!output) return false

    const results = {
      commands: []
    }

    await this.firstParameter.parse([{
      names: ['command'],
      patterns: [/^\\([A-Za-z@]+)/],
      evaluate: (reference, groups) => {
        results.commands.push(groups.command)
      }
    }])

    output.value = results

    return true
  }
}
