import * as path from 'path'

import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParsedLog, ParserMatch } from '../types'

export default class ParseMetysStdOut extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['MetysStdOut'])]
  static defaultActions: Action[] = ['parse']
  static description: string = 'Parses the console output of metys.'

  async parse () {
    const output = await this.getResolvedOutput('$DIR_0/$NAME_0.log-ParsedMetysStdOut')
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
      patterns: [/^\[metys\] Writing (.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.outputs.push(this.normalizePath(path.resolve(rootPath, match.groups.filePath)))
      }
    }, {
      names: ['filePath'],
      patterns: [/^\[metys\] Parsing (.*)$/],
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
