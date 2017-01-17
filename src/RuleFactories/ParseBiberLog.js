/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

import type { Message } from '../types'

class ParseBiberLog extends Rule {
  constructor (buildState: BuildState, jobName: ?string, ...parameters: Array<File>) {
    super(buildState, jobName, ...parameters)
    this.priority = 200
  }

  async evaluate () {
    const messages: Array<Message> = []

    await this.firstParameter.parse([{
      names: ['severity', 'text'],
      patterns: [/^[^>]+> (INFO|WARN|ERROR) - (.*)$/],
      evaluate: (reference, groups) => {
        let severity = 'error'
        switch (groups.severity) {
          case 'INFO':
            severity = 'info'
            break
          case 'WARN':
            severity = 'warning'
            break
        }

        const message: Message = {
          severity,
          name: 'Biber',
          text: groups.text,
          log: reference
        }

        messages.push(message)
      }
    }])

    this.firstParameter.contents = {
      messages
    }
  }
}

export default class ParseBiberFileLog extends RuleFactory {
  async analyze (file: File, jobName: ?string) {
    if (file.type === 'BiberLog') {
      const rule = new ParseBiberLog(this.buildState, jobName, file)
      await this.buildState.addRule(rule)
    }
  }
}
