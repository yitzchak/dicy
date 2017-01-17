/* @flow */

import Rule from '../Rule'

import type { Message } from '../types'

export default class ParseBibTeXLog extends Rule {
  static fileTypes: Set<string> = new Set(['BibTeXLog'])
  static priority: number = 200

  async evaluate () {
    const messages: Array<Message> = []

    await this.firstParameter.parse([{
      names: ['text'],
      patterns: [/^(A bad cross reference---entry .*)$/],
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
      patterns: [/^--line (\d+) of file (.+)$/],
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
      patterns: [/^(.*)---line (\d+) of file (.*)$/],
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

    this.firstParameter.contents = {
      messages
    }
  }
}
