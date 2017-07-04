/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

const MESSAGE_PATTERN = /^\s+--\s*(.*)$/

export default class ParseMakeIndexLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['MakeIndexLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any logs generated by makeindex.'

  async run () {
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedMakeIndexLog')
    if (!output) return false

    const messages: Array<Message> = []

    await this.firstParameter.parse([{
      names: ['inputPath', 'inputLine', 'outputPath', 'outputLine', 'text'],
      patterns: [
        /## Warning \(input = (.+), line = (\d+); output = (.+), line = (\d+)\):/,
        MESSAGE_PATTERN
      ],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.inputLine, 10)
        messages.push({
          severity: 'warning',
          name: 'makeindex',
          text: groups.text,
          log: reference,
          source: {
            file: groups.inputPath,
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }, {
      names: ['category', 'file', 'line', 'text'],
      patterns: [
        /^[*!]+ (Input (?:index|style)) error \(file = (.+), line = (\d+)\):$/,
        MESSAGE_PATTERN
      ],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.line, 10)
        messages.push({
          severity: 'error',
          name: 'makeindex',
          text: groups.text,
          category: groups.category,
          log: reference,
          source: {
            file: groups.file,
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }])

    output.value = { messages }

    return true
  }
}
