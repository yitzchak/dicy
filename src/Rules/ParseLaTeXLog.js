/* @flow */

import Rule from '../Rule'

import type { Message } from '../types'

export default class ParseLaTeXLog extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeXLog'])
  static priority: number = 200

  async evaluate () {
    const messages: Array<Message> = []
    let name: string
    let filePath: string

    await this.firstParameter.parse([{
      names: ['filePath'],
      patterns: [/^\*\*(.*)$/],
      evaluate: (reference, groups) => {
        filePath = groups.filePath
      }
    }, {
      names: ['name'],
      patterns: [/^This is (.*),/],
      evaluate: (reference, groups) => {
        name = groups.name
      }
    }, {
      names: ['file', 'line', 'type', 'text'],
      patterns: [/^(?:(.*):(\d+):|!)(?: (.+) Error:)? (.+?)\.?$/],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: 'error',
          name,
          type: groups.type,
          text: groups.text,
          log: reference
        }

        if (groups.file) {
          const line: number = parseInt(groups.line, 10)
          message.source = {
            file: groups.file,
            start: line,
            end: line
          }
          messages.push(message)
        }
      }
    }, {
      names: ['type', 'severity', 'text', 'line'],
      patterns: [/^(.*) (Warning|Info): +(.*?)(?: on input line (\d+)\.)?$/],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: groups.severity === 'Info' ? 'info' : 'warning',
          name,
          type: groups.type,
          text: groups.text,
          log: reference
        }

        if (groups.line) {
          const line: number = parseInt(groups.line, 10)
          message.source = {
            file: filePath,
            start: line,
            end: line
          }
        }

        messages.push(message)
      }
    }, {
      names: ['package', 'text'],
      patterns: [/^\(([^()]+)\) +(.*)$/],
      evaluate: (reference, groups) => {
        const message: Message = messages[messages.length - 1]
        if (message && message.type && message.type.endsWith(groups.package)) {
          message.text = `${message.text}\n${groups.text}`
          if (message.log) message.log.end = reference.start
        }
      }
    }])

    this.firstParameter.contents = {
      messages
    }
  }
}