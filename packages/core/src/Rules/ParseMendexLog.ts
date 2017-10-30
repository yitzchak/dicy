import * as path from 'path'

import Rule from '../Rule'

import { Action, Command, Message, ParsedLog, Reference, ParserMatch, Severity } from '../types'

export default class ParsedMendexLog extends Rule {
  static parameterTypes: Set<string>[] = [new Set<string>(['MendexLog'])]
  static commands: Set<Command> = new Set<Command>(['build', 'log'])
  static description: string = 'Parses the logs produced by all mendex variants.'
  static defaultActions: Action[] = ['parse']

  /**
   * Parse the mendex log.
   * @return {Promise<boolean>}  Status of rule evaluation
   */
  async parse (): Promise<boolean> {
    // Get the output file
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedMendexLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }
    const name: string = this.firstParameter.subType || 'mendex'
    let filePath: string

    await this.firstParameter.parse([{
      // Error/Warning messages
      names: ['severity', 'text', 'file', 'line'],
      patterns: [/^(Error|Warning): (.*?)(?: in (.*?), line ([0-9]+))?\.$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const message: Message = {
          name,
          severity: match.groups.severity.toLowerCase() as Severity,
          text: match.groups.text,
          source: { file: filePath },
          log: reference
        }

        // There is a line reference so add it to the message.
        if (match.groups.line) {
          const line: number = parseInt(match.groups.line, 10)

          message.source = {
            file: path.normalize(match.groups.file),
            range: { start: line, end: line }
          }
        }

        parsedLog.messages.push(message)
      }
    }, {
      // Bad encap messages
      names: ['text', 'file', 'line'],
      patterns: [/^Bad encap string in (.*?), line ([0-9]+)\.$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const line: number = parseInt(match.groups.line, 10)
        parsedLog.messages.push({
          name,
          severity: 'error',
          text: match.groups.text,
          source: {
            file: path.normalize(match.groups.file),
            range: { start: line, end: line }
          },
          log: reference
        })
      }
    }, {
      // Coallator failure
      names: ['text'],
      patterns: [/^(\[ICU\] Collator creation failed.*)$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name,
          severity: 'error',
          text: match.groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Entry report
      names: ['text'],
      patterns: [/^(.*? entries accepted, .*? rejected\.)$/i],
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
      patterns: [/^Scanning (?:dictionary|environment dictionary|input) file (.*?)\.$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
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
      patterns: [/^Output written in (.*?)\.$/i],
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
