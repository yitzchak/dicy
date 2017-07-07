/* @flow */

import Rule from '../Rule'

import type { Command, Message, ParsedLog } from '../types'

export default class ParseBiberLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BiberLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any biber produced logs.'

  async run () {
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedBiberLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: []
    }

    await this.firstParameter.parse([{
      names: ['text', 'input'],
      patterns: [/^[^>]+> INFO - (Found BibTeX data source '([^']+)')$/],
      evaluate: (reference, groups) => {
        parsedLog.inputs.push(groups.input)

        const message: Message = {
          severity: 'info',
          name: 'Biber',
          text: groups.text,
          log: reference
        }

        parsedLog.messages.push(message)
      }
    }, {
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

        parsedLog.messages.push(message)
      }
    }])

    output.value = parsedLog

    return true
  }
}
