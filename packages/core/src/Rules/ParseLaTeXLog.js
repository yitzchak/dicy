/* @flow */

import _ from 'lodash'

import Rule from '../Rule'

import type { Command, LineRange, Message } from '../types'

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
      evaluate: (references, groups) => {
        filePath = groups.filePath
      }
    }, {
      names: ['name'],
      patterns: [/^This is (.*),/],
      evaluate: (references, groups) => {
        name = groups.name
      }
    }, {
      names: ['text'],
      patterns: [/^Package: (.*)$/i],
      evaluate: (references, groups) => {
        messages.push({
          name,
          severity: 'info',
          text: groups.text,
          sources: filePath ? _.fromPairs([[filePath, null]]) : {},
          logs: references
        })
      }
    }, {
      names: ['category', 'text'],
      patterns: [/^! (.+) Error: (.+?)\.?$/i],
      evaluate: (references, groups) => {
        messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          sources: filePath ? _.fromPairs([[filePath, null]]) : {},
          logs: references
        })
      }
    }, {
      names: ['file', 'line', 'category', 'text'],
      patterns: [/^(.*):(\d+): (?:(.+) Error: )?(.+?)\.?$/i],
      evaluate: (references, groups) => {
        const line: number = parseInt(groups.line, 10)
        messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          logs: references,
          sources: _.fromPairs([[this.normalizePath(groups.file), { start: line, end: line }]])
        })
      }
    }, {
      names: ['category', 'severity', 'text', 'line'],
      patterns: [/^(.+) (Warning|Info): +(.*?)(?: on input line (\d+)\.)?$/i],
      evaluate: (references, groups) => {
        const message: Message = {
          severity: groups.severity.toLowerCase() === 'info' ? 'info' : 'warning',
          name,
          category: groups.category,
          text: groups.text,
          sources: {},
          logs: references
        }

        if (groups.line) {
          const line: number = parseInt(groups.line, 10)
          message.sources[filePath] = { start: line, end: line }
        } else {
          message.sources[filePath] = null
        }

        messages.push(message)
      }
    }, {
      names: ['package', 'text', 'line'],
      patterns: [/^\(([^()]+)\) +(.*?)(?: on input line (\d+)\.)?$/],
      evaluate: (references, groups) => {
        const message: Message = messages[messages.length - 1]
        if (message && message.category && message.category.endsWith(groups.package)) {
          message.text = `${message.text}\n${groups.text}`
          const oldLineRange: ?LineRange = message.logs[output.filePath]
          const newLineRange: ?LineRange = references[output.filePath]

          if (oldLineRange && newLineRange) oldLineRange.end = newLineRange.end

          if (groups.line) {
            const line: number = parseInt(groups.line, 10)
            message.sources[filePath] = { start: line, end: line }
          }
        }
      }
    }, {
      names: ['text'],
      patterns: [/^(No file .*\.)$/],
      evaluate: (references, groups) => {
        messages.push({
          severity: 'warning',
          name,
          text: groups.text,
          logs: references,
          sources: filePath ? _.fromPairs([[filePath, null]]) : {}
        })
      }
    }, {
      names: ['filePath'],
      patterns: [/^Output written on "?([^"]+)"? \([^)]*\)\.$/],
      evaluate: (references, groups) => {
        outputs.push(groups.filePath)
      }
    }], line => WRAPPED_LINE_PATTERN.test(line))

    output.value = { outputs, messages }

    return true
  }
}
