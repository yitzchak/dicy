/* @flow */

import Rule from '../Rule'

import type { Message } from '../types'

const MESSAGE_PATTERN = /^\s+--\s*(.*)$/

export default class ParseMakeIndexLog extends Rule {
  static fileTypes: Set<string> = new Set(['MakeIndexLog'])
  static priority: number = 200

  async evaluate () {
    const parsedFile = await this.getOutput(this.resolveOutputPath(`${this.firstParameter.normalizedFilePath}-parsed`))
    if (!parsedFile) return false
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
            start: line,
            end: line
          }
        })
      }
    }, {
      names: ['type', 'file', 'line', 'text'],
      patterns: [
        /^[*!]+ (Input (?:index|style)) error \(file = (.+), line = (\d+)\):$/,
        MESSAGE_PATTERN
      ],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.inputLine, 10)
        messages.push({
          severity: 'error',
          name: 'makeindex',
          text: groups.text,
          type: groups.type,
          log: reference,
          source: {
            file: groups.file,
            start: line,
            end: line
          }
        })
      }
    }])

    parsedFile.contents = {
      messages
    }
    parsedFile.forceUpdate()

    return true
  }
}
