/* @flow */

import Rule from '../Rule'

import type { Action, ParsedLog } from '../types'

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
      names: ['text', 'file', 'line'],
      patterns: [/^(.*) at (.*?) line ([0-9]+)\.$/],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.line, 10)
        parsedLog.messages.push({
          severity: 'error',
          name: 'splitindex',
          text: groups.text,
          log: reference,
          source: {
            file: groups.file,
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
