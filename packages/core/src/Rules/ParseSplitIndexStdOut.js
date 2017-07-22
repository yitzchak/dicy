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
      names: ['filePath'],
      patterns: [/^(.*?) with [0-9]+ lines$/],
      evaluate: (reference, groups) => {
        parsedLog.outputs.push(this.normalizePath(path.resolve(this.rootPath, groups.filePath)))
      }
    }])

    output.value = parsedLog

    return true
  }
}
