/* @flow */

import _ from 'lodash'

import Rule from '../Rule'

import type { Command, LineRange, Message } from '../types'

export default class ParseBibTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BibTeXLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any bibtex produced logs.'

  async run () {
    const output = await this.getResolvedOutput('$DIR/$BASE-ParsedBibTeXLog', this.firstParameter)
    if (!output) return false

    const messages: Array<Message> = []

    await this.firstParameter.parse([{
      names: ['text'],
      patterns: [/^(I couldn't open database file .*|A bad cross reference---entry .*)$/],
      evaluate: (references, groups) => {
        messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          sources: {},
          logs: references
        })
      }
    }, {
      names: ['text'],
      patterns: [/^Warning--(.+)$/],
      evaluate: (references, groups) => {
        messages.push({
          severity: 'warning',
          name: 'BibTeX',
          text: groups.text,
          sources: {},
          logs: references
        })
      }
    }, {
      names: ['line', 'file'],
      patterns: [/^-+line (\d+) of file (.+)$/],
      evaluate: (references, groups) => {
        const message: Message = messages[messages.length - 1]
        const line = parseInt(groups.line, 10)
        const oldLineRange: ?LineRange = message.logs[output.filePath]
        const newLineRange: ?LineRange = references[output.filePath]

        if (oldLineRange && newLineRange) oldLineRange.end = newLineRange.end
        message.sources[this.normalizePath(groups.file)] = {
          start: line,
          end: line
        }
      }
    }, {
      names: ['text', 'line', 'file'],
      patterns: [/^(.+)---line (\d+) of file (.*)$/],
      evaluate: (references, groups) => {
        const line = parseInt(groups.line, 10)
        const file = this.normalizePath(groups.file)

        messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          logs: references,
          sources: _.fromPairs([[file, { start: line, end: line }]])
        })
      }
    }])

    output.value = { messages }

    return true
  }
}
