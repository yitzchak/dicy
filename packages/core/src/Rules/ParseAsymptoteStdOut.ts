import * as path from 'path'

import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParsedLog, ParserMatch } from '../types'

export default class ParseAsymptoteStdOut extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['AsymptoteStdOut'])]
  static defaultActions: Action[] = ['parse']
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
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        rootPath = match.groups.filePath
      }
    }, {
      names: ['filePath'],
      patterns: [/^Wrote (.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.outputs.push(this.normalizePath(path.resolve(rootPath, match.groups.filePath)))
      }
    }, {
      names: ['type', 'filePath'],
      patterns: [/^(Including|Loading) \S+ from (.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        if (!path.isAbsolute(match.groups.filePath)) {
          parsedLog.inputs.push(this.normalizePath(path.resolve(rootPath, match.groups.filePath)))
        }
      }
    }])

    output.value = parsedLog

    return true
  }
}
