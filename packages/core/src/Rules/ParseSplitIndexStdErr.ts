import Rule from '../Rule'

import { Action, ParsedLog, ParserMatch, Reference } from '../types'

export default class ParseSplitIndexStdOut extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['SplitIndexStdErr'])]
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses the error output of splitindex.'

  async parse () {
    const output = await this.getResolvedOutput('$DIR_0/$NAME_0.log-ParsedSplitIndexStdErr')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }

    await this.firstParameter.parse([{
      // splitindex generates error messages via Perl's die command so we just
      // parse anything that has that form.
      names: ['text', 'file', 'line'],
      patterns: [/^(.*) at (.*?) line ([0-9]+)\.$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const line = parseInt(match.groups.line, 10)

        // Do not include the log reference since it is to a virtual file.
        parsedLog.messages.push({
          severity: 'error',
          name: 'splitindex',
          text: match.groups.text,
          source: {
            file: match.groups.file,
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }])

    output.value = parsedLog

    return true
  }
}
