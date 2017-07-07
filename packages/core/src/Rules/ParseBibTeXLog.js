/* @flow */

import Rule from '../Rule'

import type { Command, ParsedLog } from '../types'

export default class ParseBibTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BibTeXLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any bibtex produced logs.'

  async run () {
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedBibTeXLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: []
    }

    await this.firstParameter.parse([{
      // Missing database files or missing cross references.
      names: ['text'],
      patterns: [/^(I couldn't open database file .*|A bad cross reference---entry .*)$/],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          log: reference
        })
      }
    }, {
      // Warning messages
      names: ['text'],
      patterns: [/^Warning--(.+)$/],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          severity: 'warning',
          name: 'BibTeX',
          text: groups.text,
          log: reference
        })
      }
    }, {
      // Continued source references.
      names: ['line', 'file'],
      patterns: [/^-+line (\d+) of file (.+)$/],
      evaluate: (reference, groups) => {
        const message = parsedLog.messages[parsedLog.messages.length - 1]
        const line = parseInt(groups.line, 10)

        // Extend the log reference
        if (message.log && message.log.range && reference.range) message.log.range.end = reference.range.start

        // Add a source reference
        message.source = {
          file: this.normalizePath(groups.file),
          range: {
            start: line,
            end: line
          }
        }
      }
    }, {
      // Error messages with a source reference.
      names: ['text', 'line', 'file'],
      patterns: [/^(.+)---line (\d+) of file (.*)$/],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.line, 10)
        parsedLog.messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          log: reference,
          source: {
            file: this.normalizePath(groups.file),
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }, {
      // Input file notifications.
      names: ['input'],
      patterns: [/^(?:Database file #\d+|The style file|The top-level auxiliary file|A level-\d+ auxiliary file): (.*)$/],
      evaluate: (reference, groups) => {
        parsedLog.inputs.push(groups.input)
      }
    }])

    const { stdout } = await this.executeCommand({
      args: ['kpsewhich'].concat(parsedLog.inputs),
      cd: '$ROOTDIR',
      severity: 'warning'
    })

    parsedLog.inputs = stdout
      ? stdout.split('\n').filter(file => file).map(file => this.normalizePath(file))
      : []

    output.value = parsedLog

    return true
  }
}
