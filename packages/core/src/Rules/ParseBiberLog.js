/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

export default class ParseBiberLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BiberLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any biber produced logs.'

  async run () {
    const output = await this.getResolvedOutput('$DIR/$BASE-ParsedBiberLog', this.firstParameter)
    if (!output) return false

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

    output.value = { messages }

    return true
  }
}
