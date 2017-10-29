

import Rule from '../Rule'

import { Action, Command, ParsedLog, ParserMatch, Reference } from '../types'

export default class ParseBibTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BibTeXLog'])]
  static commands: Set<Command> = new Set<Command>(['build', 'log'])
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses any bibtex produced logs.'

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedBibTeXLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }
    const name: string = (this.firstParameter.subType === '8-bit Big BibTeX')
      ? 'BibTeX8'
      : (this.firstParameter.subType || 'BibTeX')

    await this.firstParameter.parse([{
      // Missing database files or missing cross references.
      names: ['text'],
      patterns: [/^(I couldn't open (?:auxiliary|database) file .*|A bad cross reference---entry .*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          severity: 'error',
          name,
          text: match.groups.text,
          log: reference
        })
      }
    }, {
      // Warning messages
      names: ['text'],
      patterns: [/^Warning--(.+)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          severity: 'warning',
          name,
          text: match.groups.text,
          log: reference
        })
      }
    }, {
      // Continued source references.
      names: ['line', 'file'],
      patterns: [/^-+line (\d+) of file (.+)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const message = parsedLog.messages[parsedLog.messages.length - 1]
        if (message) {
          const line = parseInt(match.groups.line, 10)

          // Extend the log reference
          if (message.log && message.log.range && reference.range) message.log.range.end = reference.range.start

          // Add a source reference
          message.source = {
            file: this.normalizePath(match.groups.file),
            range: {
              start: line,
              end: line
            }
          }
        }
      }
    }, {
      // Error messages with a source reference.
      names: ['text', 'line', 'file'],
      patterns: [/^(.+)---line (\d+) of file (.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const line = parseInt(match.groups.line, 10)
        parsedLog.messages.push({
          severity: 'error',
          name,
          text: match.groups.text,
          log: reference,
          source: {
            file: this.normalizePath(match.groups.file),
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }, {
      // Input file notifications. The non-greedy pattern at the beginning is to
      // work around a MiKTeX bug in which there is no newline after the first
      // line.
      names: ['input'],
      patterns: [/^.*?(?:Database file #\d+|The style file|The top-level auxiliary file|A level-\d+ auxiliary file): (.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.inputs.push(match.groups.input)
      }
    }])

    try {
      const { stdout } = await this.executeCommand({
        args: ['kpsewhich'].concat(parsedLog.inputs),
        cd: '$ROOTDIR',
        severity: 'warning',
        stdout: true
      })

      parsedLog.inputs = stdout
        ? stdout.split('\n').filter((file: string) => file).map(file => this.normalizePath(file))
        : []
    } catch (error) {}

    output.value = parsedLog

    return true
  }
}
