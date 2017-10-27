/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Action, ParsedLog } from '../types'

export default class ParseSplitIndexStdOut extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['SplitIndexStdOut'])]
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses the console output of splitindex.'

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
      evaluate: (mode, reference, groups) => {
        // Do not include the reference since it is to a virtual file.
        parsedLog.messages.push({
          severity: 'info',
          name: 'splitindex',
          text: groups.text
        })
      }
    }, {
      names: ['filePath'],
      patterns: [/^(.*?) with [0-9]+ lines$/],
      evaluate: (mode, reference, groups) => {
        // Do not include the reference since it is to a virtual file.
        parsedLog.messages.push({
          severity: 'info',
          name: 'splitindex',
          text: groups._
        })
        parsedLog.outputs.push(this.normalizePath(path.resolve(this.rootPath, groups.filePath)))
      }
    }])

    output.value = parsedLog

    return true
  }
}
