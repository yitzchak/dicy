/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

const WRAPPED_LINE_PATTERN = /^.{76}[^.]{3}$/

export default class ParseLaTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LaTeXLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses the logs produced by all latex variants.'

  async run () {
    const output = await this.getResolvedOutput('$DIR/$BASE-ParsedLaTeXLog', this.firstParameter)
    if (!output) return false

    const messages: Array<Message> = []
    const outputs: Array<string> = []
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
      patterns: [/^Package: (.*)$/i],
      evaluate: (reference, groups) => {
        messages.push({
          name,
          severity: 'info',
          text: groups.text,
          sources: [],
          log: reference
        })
      }
    }, {
      names: ['category', 'text'],
      patterns: [/^! (.+) Error: (.+?)\.?$/i],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          sources: [],
          log: reference
        })
      }
    }, {
      names: ['file', 'line', 'category', 'text'],
      patterns: [/^(.*):(\d+): (?:(.+) Error: )?(.+?)\.?$/i],
      evaluate: (reference, groups) => {
        const line: number = parseInt(groups.line, 10)
        messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          log: reference,
          sources: [{
            file: groups.file,
            start: line,
            end: line
          }]
        })
      }
    }, {
      names: ['category', 'severity', 'text', 'line'],
      patterns: [/^(.+) (Warning|Info): +(.*?)(?: on input line (\d+)\.)?$/i],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: groups.severity.toLowerCase() === 'info' ? 'info' : 'warning',
          name,
          category: groups.category,
          text: groups.text,
          sources: [],
          log: reference
        }

        if (groups.line) {
          const line: number = parseInt(groups.line, 10)
          // $FlowIgnore
          message.sources.push({
            file: filePath,
            start: line,
            end: line
          })
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
          log: reference,
          sources: []
        })
      }
    }, {
      names: ['filePath'],
      patterns: [/^Output written on "?([^"]+)"? \([^)]*\)\.$/],
      evaluate: (reference, groups) => {
        outputs.push(groups.filePath)
      }
    }], line => WRAPPED_LINE_PATTERN.test(line))

    output.value = { outputs, messages }

    return true
  }
}
