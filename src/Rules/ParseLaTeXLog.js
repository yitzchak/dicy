/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

export default class ParseLaTeXLog extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeXLog'])
  static commands: Set<Command> = new Set(['build', 'report'])

  async initialize () {
    this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedLaTeXLog`)
  }

  async run () {
    const parsedFile = await this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedLaTeXLog`)
    if (!parsedFile) return false
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
      names: ['text'],
      patterns: [/^Package: (.*)$/],
      evaluate: (reference, groups) => {
        messages.push({
          name,
          severity: 'info',
          text: groups.text,
          log: reference
        })
      }
    }, {
      names: ['category', 'text'],
      patterns: [/^! (.+) Error: (.+?)\.?$/],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          log: reference
        })
      }
    }, {
      names: ['file', 'line', 'category', 'text'],
      patterns: [/^(.*):(\d+): (.+) Error: (.+?)\.?$/],
      evaluate: (reference, groups) => {
        const line: number = parseInt(groups.line, 10)
        messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          log: reference,
          source: {
            file: groups.file,
            start: line,
            end: line
          }
        })
      }
    }, {
      names: ['category', 'severity', 'text', 'line'],
      patterns: [/^(.*) (Warning|Info): +(.*?)(?: on input line (\d+)\.)?$/],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: groups.severity === 'Info' ? 'info' : 'warning',
          name,
          category: groups.category,
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
        if (message && message.category && message.category.endsWith(groups.package)) {
          message.text = `${message.text}\n${groups.text}`
          if (message.log) message.log.end = reference.start
        }
      }
    }, {
      names: ['text'],
      patterns: [/^(No file .*\.)$/],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'warning',
          name,
          text: groups.text,
          log: reference
        })
      }
    }])

    parsedFile.value = { messages }

    return true
  }
}
