/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Action, ParsedLog } from '../types'

export default class ParseAsymptoteStdOut extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['AsymptoteStdOut'])]
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses the console output of Asymptote.'

  async parse () {
    const output = await this.getResolvedOutput('$DIR_0/$NAME_0.log-ParsedAsymptoteStdOut')
    if (!output) return false

    let rootPath = this.rootPath
    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }

    await this.firstParameter.parse([{
      names: ['filePath'],
      patterns: [/^cd (.*)$/],
      evaluate: (reference, groups) => {
        rootPath = groups.filePath
      }
    }, {
      names: ['filePath'],
      patterns: [/^Wrote (.*)$/],
      evaluate: (reference, groups) => {
        parsedLog.outputs.push(this.normalizePath(path.resolve(rootPath, groups.filePath)))
      }
    }, {
      names: ['type', 'filePath'],
      patterns: [/^(Including|Loading) \S+ from (.*)$/],
      evaluate: (reference, groups) => {
        if (!path.isAbsolute(groups.filePath)) {
          parsedLog.inputs.push(this.normalizePath(path.resolve(rootPath, groups.filePath)))
        }
      }
    }])

    output.value = parsedLog

    return true
  }
}
