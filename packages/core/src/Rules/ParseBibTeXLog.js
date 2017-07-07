/* @flow */

import Rule from '../Rule'

import type { Command, Message, ParsedLog } from '../types'

export default class ParseBibTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BibTeXLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any bibtex produced logs.'

  async run () {
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedBibTeXLog')
    if (!output) return false

    // const bibinputs = this.options['$BIBINPUTS']
    //   .filter(pattern => pattern)
    //   .map(pattern => this.resolvePath(pattern))

    const messages: Array<Message> = []
    const inputNames: Array<string> = []

    await this.firstParameter.parse([{
      names: ['text'],
      patterns: [/^(I couldn't open database file .*|A bad cross reference---entry .*)$/],
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
      patterns: [/^-+line (\d+) of file (.+)$/],
      evaluate: (reference, groups) => {
        const message = messages[messages.length - 1]
        const line = parseInt(groups.line, 10)
        if (message.log && message.log.range && reference.range) message.log.range.end = reference.range.start
        message.source = {
          file: this.normalizePath(groups.file),
          range: {
            start: line,
            end: line
          }
        }
      }
    }, {
      names: ['text', 'line', 'file'],
      patterns: [/^(.+)---line (\d+) of file (.*)$/],
      evaluate: (reference, groups) => {
        const line = parseInt(groups.line, 10)
        messages.push({
          severity: 'error',
          name: 'BibTeX',
          text: groups.text,
          log: reference,
          source: {
            file: this.normalizePath(groups.file),
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }, {
      names: ['input'],
      patterns: [/^Database file #\d+: (.*)$/],
      evaluate: (reference, groups) => {
        inputNames.push(groups.input)
      }
    }, {
      names: ['input'],
      patterns: [/^The style file: (.*)$/],
      evaluate: (reference, groups) => {
        inputNames.push(groups.input)
      }
    }])

    const { stdout } = await this.executeCommand({
      args: ['kpsewhich'].concat(inputNames),
      cd: '$ROOTDIR',
      severity: 'warning'
    })

    const parsedLog: ParsedLog = {
      messages,
      inputs: stdout
        ? stdout.split('\n').filter(file => file).map(file => this.normalizePath(file))
        : [],
      outputs: []
    }

    output.value = parsedLog

    return true
  }
}
