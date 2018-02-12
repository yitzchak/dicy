import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParsedLog, ParserMatch, RuleDescription } from '../types'

export default class ParseBibTeXLog extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build', 'log'],
    phases: ['execute'],
    parameters: [['BibToGlsLog']]
  }]
  static defaultActions: Action[] = ['parse']

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
