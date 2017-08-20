/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Action, Command, Message, ParsedLog } from '../types'

export default class ParsedMendexLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['MendexLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses the logs produced by all mendex variants.'
  static defaultActions: Array<Action> = ['parse']

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
      evaluate: (reference, groups) => {
        const message: Message = {
          name,
          severity: groups.severity.toLowerCase(),
          text: groups.text,
          source: { file: filePath },
          log: reference
        }

        // There is a line reference so add it to the message.
        if (groups.line) {
          const line: number = parseInt(groups.line, 10)

          message.source = {
            file: path.normalize(groups.file),
            range: { start: line, end: line }
          }
        }

        parsedLog.messages.push(message)
      }
    }, {
      // Bad encap messages
      names: ['text', 'file', 'line'],
      patterns: [/^Bad encap string in (.*?), line ([0-9]+)\.$/i],
      evaluate: (reference, groups) => {
        const line: number = parseInt(groups.line, 10)
        parsedLog.messages.push({
          name,
          severity: 'error',
          text: groups.text,
          source: {
            file: path.normalize(groups.file),
            range: { start: line, end: line }
          },
          log: reference
        })
      }
    }, {
      // Coallator failure
      names: ['text'],
      patterns: [/^(\[ICU\] Collator creation failed.*)$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name,
          severity: 'error',
          text: groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Entry report
      names: ['text'],
      patterns: [/^(.*? entries accepted, .*? rejected\.)$/i],
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
      patterns: [/^Scanning (?:dictionary|environment dictionary|input) file (.*?)\.$/i],
      evaluate: (reference, groups) => {
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
      patterns: [/^Output written in (.*?)\.$/i],
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
