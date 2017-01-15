/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

import type { Message, Reference } from '../types'

class ParseLaTeXLog extends Rule {
  constructor (buildState: BuildState, ...parameters: Array<File>) {
    super(buildState, ...parameters)
    this.priority = 1
  }

  async evaluate () {
    const messages: Array<Message> = []
    let name: string
    let filePath: string

    await this.firstParameter.parse([{
      patterns: [/^\*\*(.*)$/],
      evaluate: (reference, groups) => {
        filePath = groups[0]
      }
    }, {
      patterns: [/^This is (.*),/],
      evaluate: (reference, groups) => {
        name = groups[0]
      }
    }, {
      patterns: [/^(?:(.*):(\d+):|!)(?: (.+) Error:)? (.+?)\.?$/],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: 'error',
          name,
          type: groups[2],
          text: groups[3],
          log: reference
        }

        if (groups[0]) {
          const line: number = parseInt(groups[1], 10)
          message.source = {
            file: groups[0],
            start: line,
            end: line
          }
          messages.push(message)
        }
      }
    }, {
      patterns: [/^(.*) (Warning|Info): +(.*?)(?: on input line (\d+))?\.$/],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: groups[1] === 'Info' ? 'info' : 'warning',
          name,
          type: groups[0],
          text: groups[2],
          log: reference
        }

        if (groups[3]) {
          const line: number = parseInt(groups[3], 10)
          message.source = {
            file: filePath,
            start: line,
            end: line
          }
        }

        messages.push(message)
      }
    }])

    this.firstParameter.contents = messages
  }
}

export default class ParseLaTeXFileLog extends RuleFactory {
  async analyze (files: Array<File>) {
    for (const file: File of files) {
      if (file.type === 'LaTeXLog') {
        const rule = new ParseLaTeXLog(this.buildState, file)
        await this.buildState.addRule(rule)
      }
    }
  }
}
