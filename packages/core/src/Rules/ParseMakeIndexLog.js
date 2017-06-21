/* @flow */

import _ from 'lodash'

import Rule from '../Rule'

import type { Command, Message } from '../types'

const MESSAGE_PATTERN = /^\s+--\s*(.*)$/

export default class ParseMakeIndexLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['MakeIndexLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any logs generated by makeindex.'

  async run () {
    const output = await this.getResolvedOutput('$DIR/$BASE-ParsedMakeIndexLog', this.firstParameter)
    if (!output) return false

    const messages: Array<Message> = []

    await this.firstParameter.parse([{
      names: ['inputPath', 'inputLine', 'outputPath', 'outputLine', 'text'],
      patterns: [
        /## Warning \(input = (.+), line = (\d+); output = (.+), line = (\d+)\):/,
        MESSAGE_PATTERN
      ],
      evaluate: (references, groups) => {
        const line = parseInt(groups.inputLine, 10)
        const file = this.normalizePath(groups.inputPath)

        messages.push({
          severity: 'warning',
          name: 'makeindex',
          text: groups.text,
          logs: references,
          sources: _.fromPairs([[file, { start: line, end: line }]])
        })
      }
    }, {
      names: ['category', 'file', 'line', 'text'],
      patterns: [
        /^[*!]+ (Input (?:index|style)) error \(file = (.+), line = (\d+)\):$/,
        MESSAGE_PATTERN
      ],
      evaluate: (references, groups) => {
        const line = parseInt(groups.line, 10)
        const file = this.normalizePath(groups.file)

        messages.push({
          severity: 'error',
          name: 'makeindex',
          text: groups.text,
          category: groups.category,
          logs: references,
          sources: _.fromPairs([[file, { start: line, end: line }]])
        })
      }
    }])

    output.value = { messages }

    return true
  }
}
