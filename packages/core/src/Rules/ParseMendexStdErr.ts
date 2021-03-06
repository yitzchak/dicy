import { Command, Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParsedLog, ParserMatch } from '../types'

export default class ParsedMendexStdErr extends Rule {
  static parameterTypes: Set<string>[] = [new Set<string>(['MendexStdErr'])]
  static commands: Set<Command> = new Set<Command>(['build', 'log'])
  static description: string = 'Parses the error produced by all mendex variants.'
  static defaultActions: Action[] = ['parse']

  /**
   * Parse the mendex log.
   * @return {Promise<boolean>}  Status of rule evaluation
   */
  async parse (): Promise<boolean> {
    // Get the output file
    const output = await this.getResolvedOutput('$DIR_0/$NAME_0.log-ParsedMendexStdErr')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }
    let name: string = 'mendex'

    await this.firstParameter.parse([{
      // Get the name
      names: ['text'],
      patterns: [/^This is (upmendex|mendex) /i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        name = match.groups.name
      }
    }, {
      // Dictionary Error
      names: ['name', 'text'],
      patterns: [/^(upmendex|mendex): (.*? is forbidden to open for reading\.)$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name: match.groups.name,
          severity: 'error',
          text: match.groups.text
        })
      }
    }, {
      // Missing file errors
      names: ['text'],
      patterns: [/^(No log file, .*?\.|.*? does not exist\.)$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name,
          severity: 'error',
          text: match.groups.text
        })
      }
    }, {
      // Bad kanji encoding
      names: ['text'],
      patterns: [/^(Ignoring bad kanji encoding.*)$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name,
          severity: 'warning',
          text: match.groups.text
        })
      }
    }])

    output.value = parsedLog

    return true
  }
}
