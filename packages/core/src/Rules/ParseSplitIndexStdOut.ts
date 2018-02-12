import * as path from 'path'

import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParsedLog, ParserMatch, RuleDescription } from '../types'

export default class ParseSplitIndexStdOut extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['SplitIndexStdOut']]
  }]
  static defaultActions: Action[] = ['parse']

  async parse () {
    const output = await this.getResolvedOutput('$DIR_0/$NAME_0.log-ParsedSplitIndexStdOut')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }

    await this.firstParameter.parse([{
      names: ['text'],
      patterns: [/^(Close.*|New index file.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        // Do not include the reference since it is to a virtual file.
        parsedLog.messages.push({
          severity: 'info',
          name: 'splitindex',
          text: match.groups.text
        })
      }
    }, {
      names: ['filePath'],
      patterns: [/^(.*?) with [0-9]+ lines$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        // Do not include the reference since it is to a virtual file.
        parsedLog.messages.push({
          severity: 'info',
          name: 'splitindex',
          text: match._
        })
        parsedLog.outputs.push(this.normalizePath(path.resolve(this.rootPath, match.groups.filePath)))
      }
    }])

    output.value = parsedLog

    return true
  }
}
