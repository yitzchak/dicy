/* @flow */

import Rule from '../Rule'

import type { Action, Command, ParsedLog } from '../types'

export default class ParseBibTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BibTeXLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses any bibtex produced logs.'

  async parse () {
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedBibTeXLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }
    const name: string = (this.firstParameter.subType === '8-bit Big BibTeX')
      ? 'BibTeX8'
      : (this.firstParameter.subType || 'BibTeX')

    await this.firstParameter.parse([{
      // Missing database files or missing cross references.
      names: ['text'],
      patterns: [/^(I couldn't open database file .*|A bad cross reference---entry .*)$/],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          severity: 'error',
          name,
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
          name,
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
          name,
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
      // Input file notifications. The non-greedy pattern at the beginning is to
      // work around a MiKTeX bug in which there is no newline after the first
      // line.
      names: ['input'],
      patterns: [/^.*?(?:Database file #\d+|The style file|The top-level auxiliary file|A level-\d+ auxiliary file): (.*)$/],
      evaluate: (reference, groups) => {
        parsedLog.inputs.push(groups.input)
      }
    }])

    try {
      const { stdout } = await this.executeCommand({
        args: ['kpsewhich'].concat(parsedLog.inputs),
        cd: '$ROOTDIR',
        severity: 'warning',
        stdout: true
      })

      parsedLog.inputs = stdout
        ? stdout.split('\n').filter(file => file).map(file => this.normalizePath(file))
        : []
    } catch (error) {}

    output.value = parsedLog

    return true
  }
}
