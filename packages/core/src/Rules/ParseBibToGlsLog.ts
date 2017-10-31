import Rule from '../Rule'

import { Action, Command, ParsedLog, ParserMatch, Reference } from '../types'

export default class ParseBibTeXLog extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['BibToGlsLog'])]
  static commands: Set<Command> = new Set<Command>(['build', 'log'])
  static defaultActions: Action[] = ['parse']
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
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.outputs.push(this.normalizePath(match.groups.output))
      }
    }, {
      names: ['input'],
      patterns: [/^Reading (.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.inputs.push(this.normalizePath(match.groups.input))
      }
    }])

    output.value = parsedLog

    return true
  }
}
