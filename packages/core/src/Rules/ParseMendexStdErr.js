/* @flow */

import Rule from '../Rule'

import type { Action, Command, ParsedLog } from '../types'

export default class ParsedMendexStdErr extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['MendexStdErr'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses the error produced by all mendex variants.'
  static defaultActions: Array<Action> = ['parse']

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
      calls: [],
      requests: []
    }
    let name: string = 'mendex'

    await this.firstParameter.parse([{
      // Get the name
      names: ['text'],
      patterns: [/^This is (upmendex|mendex) /i],
      evaluate: (reference, groups) => {
        name = groups.name
      }
    }, {
      // Dictionary Error
      names: ['name', 'text'],
      patterns: [/^(upmendex|mendex): (.*? is forbidden to open for reading\.)$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name: groups.name,
          severity: 'error',
          text: groups.text
        })
      }
    }, {
      // Missing file errors
      names: ['text'],
      patterns: [/^(No log file, .*?\.|.*? does not exist\.)$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name,
          severity: 'error',
          text: groups.text
        })
      }
    }, {
      // Bad kanji encoding
      names: ['text'],
      patterns: [/^(Ignoring bad kanji encoding.*)$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name,
          severity: 'warning',
          text: groups.text
        })
      }
    }])

    output.value = parsedLog

    return true
  }
}
