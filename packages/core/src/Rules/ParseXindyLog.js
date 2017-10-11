/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Action, Command, ParsedLog } from '../types'

export default class ParsedXindyLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['XindyLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses the logs produced by xindy and texindy.'
  static defaultActions: Array<Action> = ['parse']

  /**
   * Parse the xindy log.
   * @return {Promise<boolean>}  Status of rule evaluation
   */
  async parse (): Promise<boolean> {
    // Get the output file
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedXindyLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: [],
      requests: []
    }
    const name: string = 'xindy'
    let filePath: string

    await this.firstParameter.parse([{
      // Error/Warning messages with file references
      names: ['severity', 'text', 'file'],
      patterns: [/^(ERROR|WARNING): (.*? in:?)$/i, /(.*)/],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name,
          severity: groups.severity.toLowerCase(),
          text: `${groups.text} ${groups.file}`,
          source: { file: path.normalize(groups.file) },
          log: reference
        })
      }
    }, {
      // Error/Warning messages
      names: ['severity', 'text'],
      patterns: [/^(ERROR|WARNING): (.*)$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name,
          severity: groups.severity.toLowerCase(),
          text: groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Module loadings
      names: ['text'],
      patterns: [/^(Loading module .*|Finished loading module .*)$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Input files
      names: ['file'],
      patterns: [/^Reading raw-index (.*?)[.]{3}$/i],
      evaluate: (reference, groups) => {
        filePath = path.normalize(groups.file)
        parsedLog.inputs.push(path.normalize(groups.file))
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: groups._,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Output files
      names: ['file'],
      patterns: [/^(?:Markup written into file|Opening logfile) (.*?)[. ]$/i],
      evaluate: (reference, groups) => {
        parsedLog.outputs.push(path.normalize(groups.file))
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: groups._,
          source: { file: filePath },
          log: reference
        })
      }
    }])

    output.value = parsedLog

    return true
  }
}
