/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

export default class ParseBibTeXLog extends Rule {
  static fileTypes: Set<string> = new Set(['BibTeXLog'])
  static commands: Set<Command> = new Set(['build', 'report'])
  static description: string = 'Parses any bibtex produced logs.'

  async initialize () {
    this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedBibTeXLog`)
  }

  async run () {
    const parsedFile = await this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedBibTeXLog`)
    if (!parsedFile) return false
    const messages: Array<Message> = []

    await this.firstParameter.parse([{
      names: ['text'],
      patterns: [/^(I couldn't open database file .*|A bad cross reference---entry .*)$/],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          log: reference
        })
      }
    }, {
      names: ['text'],
      patterns: [/^Warning--(.+)$/],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'warning',
          name: 'BibTeX',
          text: groups.text,
          log: reference
        })
      }
    }, {
      names: ['line', 'file'],
      patterns: [/^-+line (\d+) of file (.+)$/],
      evaluate: (reference, groups) => {
        const message = messages[messages.length - 1]
        const line = parseInt(groups.line, 10)
        if (message.log) message.log.end = reference.start
        message.source = {
          file: this.normalizePath(groups.file),
          start: line,
          end: line
        }
      }
    }, {
      names: ['text', 'line', 'file'],
      patterns: [/^(.+)---line (\d+) of file (.*)$/],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.line, 10)
        messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          log: reference,
          source: {
            file: this.normalizePath(groups.file),
            start: line,
            end: line
          }
        })
      }
    }])

    parsedFile.value = { messages }

    return true
  }
}
