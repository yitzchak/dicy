import * as path from 'path'

import Rule from '../Rule'

import { Action, Command, ParsedLog, ParserMatch, Reference, Severity } from '../types'

export default class ParsedXindyLog extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['XindyLog'])]
  static commands: Set<Command> = new Set<Command>(['build', 'log'])
  static description: string = 'Parses the logs produced by xindy and texindy.'
  static defaultActions: Action[] = ['parse']

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
      calls: []
    }
    const name: string = 'xindy'
    let filePath: string

    await this.firstParameter.parse([{
      // Error/Warning messages with file references
      names: ['severity', 'text', 'file'],
      patterns: [/^(ERROR|WARNING): (.*? in:?)$/i, /(.*)/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name,
          severity: <Severity>match.groups.severity.toLowerCase(),
          text: `${match.groups.text} ${match.groups.file}`,
          source: { file: path.normalize(match.groups.file) },
          log: reference
        })
      }
    }, {
      // Error/Warning messages
      names: ['severity', 'text'],
      patterns: [/^(ERROR|WARNING): (.*)$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name,
          severity: <Severity>match.groups.severity.toLowerCase(),
          text: match.groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Module loadings
      names: ['text'],
      patterns: [/^(Loading module .*|Finished loading module .*)$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: match.groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Input files
      names: ['file'],
      patterns: [/^Reading raw-index (.*?)[.]{3}$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        filePath = path.normalize(match.groups.file)
        parsedLog.inputs.push(path.normalize(match.groups.file))
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: match._,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Output files
      names: ['file'],
      patterns: [/^(?:Markup written into file|Opening logfile) (.*?)[. ]$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.outputs.push(path.normalize(match.groups.file))
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: match._,
          source: { file: filePath },
          log: reference
        })
      }
    }])

    output.value = parsedLog

    return true
  }
}
