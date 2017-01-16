/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

import type { Message } from '../types'

class ParseBibTeXLog extends Rule {
  constructor (buildState: BuildState, ...parameters: Array<File>) {
    super(buildState, ...parameters)
    this.priority = 200
  }

  async evaluate () {
    const messages: Array<Message> = []

    await this.firstParameter.parse([{
      names: ['text'],
      patterns: [/^(A bad cross reference---entry .*)$/],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          log: reference
        })
      }
    }, {
      names: ['text'],
      patterns: [/^Warning--(.+)$/],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'warning',
          name: 'BibTeX',
          text: groups.text,
          log: reference
        })
      }
    }, {
      names: ['line', 'file'],
      patterns: [/^--line (\d+) of file (.+)$/],
      evaluate: (reference, groups) => {
        const message = messages[messages.length - 1]
        const line = parseInt(groups.line, 10)
        if (message.log) message.log.end = reference.start
        message.source = {
          file: this.buildState.normalizePath(groups.file),
          start: line,
          end: line
        }
      }
    }, {
      names: ['text', 'line', 'file'],
      patterns: [/^(.*)---line (\d+) of file (.*)$/],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.line, 10)
        messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          log: reference,
          source: {
            file: this.buildState.normalizePath(groups.file),
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

export default class ParseBibTeXFileLog extends RuleFactory {
  async analyze (files: Array<File>) {
    for (const file: File of files) {
      if (file.type === 'BibTeXLog') {
        const rule = new ParseBibTeXLog(this.buildState, file)
        await this.buildState.addRule(rule)
      }
    }
  }
}
