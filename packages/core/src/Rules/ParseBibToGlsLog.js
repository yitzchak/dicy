/* @flow */

import Rule from '../Rule'

import type { Action, Command, ParsedLog } from '../types'

export default class ParseBibTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BibToGlsLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses any bib2gls produced logs.'

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedBibToGlsLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }

    await this.firstParameter.parse([{
      names: ['output'],
      patterns: [/^Writing (.*)$/],
      evaluate: (reference, groups) => {
        parsedLog.outputs.push(this.normalizePath(groups.output))
      }
    }, {
      names: ['input'],
      patterns: [/^Reading (.*)$/],
      evaluate: (reference, groups) => {
        parsedLog.inputs.push(this.normalizePath(groups.input))
      }
    }])

    output.value = parsedLog

    return true
  }
}
