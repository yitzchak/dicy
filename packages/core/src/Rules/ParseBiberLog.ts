import { Message, Reference, Severity } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParsedLog, ParserMatch, RuleDescription } from '../types'

export default class ParseBiberLog extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build', 'log'],
    phases: ['execute'],
    parameters: [['BiberLog']]
  }]
  static defaultActions: Action[] = ['parse']

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedBiberLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }

    await this.firstParameter.parse([{
      // Input messages
      names: ['text', 'input'],
      patterns: [/^[^>]+> INFO - ((?:Found BibTeX data source|Reading) '([^']+)')$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.inputs.push(match.groups.input)

        const message: Message = {
          severity: 'info',
          name: 'Biber',
          text: match.groups.text,
          log: reference
        }

        parsedLog.messages.push(message)
      }
    }, {
      // Output messages
      names: ['text', 'output'],
      patterns: [/^[^>]+> INFO - ((?:Writing|Logfile is) '([^']+)'.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.outputs.push(match.groups.output)

        const message: Message = {
          severity: 'info',
          name: 'Biber',
          text: match.groups.text,
          log: reference
        }

        parsedLog.messages.push(message)
      }
    }, {
      // All other messages
      names: ['severity', 'text'],
      patterns: [/^[^>]+> (INFO|WARN|ERROR) - (.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        let severity = 'error'
        switch (match.groups.severity) {
          case 'INFO':
            severity = 'info'
            break
          case 'WARN':
            severity = 'warning'
            break
        }

        const message: Message = {
          severity: severity as Severity,
          name: 'Biber',
          text: match.groups.text,
          log: reference
        }

        parsedLog.messages.push(message)
      }
    }])

    output.value = parsedLog

    return true
  }
}
