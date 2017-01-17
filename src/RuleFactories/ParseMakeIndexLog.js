/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

import type { Message } from '../types'

const MESSAGE_PATTERN = /^\s+--\s*(.*)$/

class ParseMakeIndexLog extends Rule {
  constructor (buildState: BuildState, jobName: ?string, ...parameters: Array<File>) {
    super(buildState, jobName, ...parameters)
    this.priority = 200
  }

  async evaluate () {
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

    this.firstParameter.contents = {
      messages
    }
  }
}

export default class ParseMakeIndexFileLog extends RuleFactory {
  async analyze (file: File, jobName: ?string) {
    if (file.type === 'MakeIndexLog') {
      const rule = new ParseMakeIndexLog(this.buildState, jobName, file)
      await this.buildState.addRule(rule)
    }
  }
}
