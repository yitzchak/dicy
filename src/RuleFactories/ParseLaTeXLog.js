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
      patterns: [/^(.*) (Warning|Info): +(.*?)(?: on input line (\d+))?\.$/],
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
