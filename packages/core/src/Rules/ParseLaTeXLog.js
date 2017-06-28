/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

const WRAPPED_LINE_PATTERN = /^.{76}[^.]{3}$/

export default class ParseLaTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LaTeXLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses the logs produced by all latex variants.'

  async run () {
    const output = await this.getResolvedOutput('$DIR/$BASE-ParsedLaTeXLog', this.firstParameter)
    if (!output) return false

    const messages: Array<Message> = []
    const outputs: Array<string> = []
    let name: string
    let filePath: string

    await this.firstParameter.parse([{
      names: ['filePath'],
      patterns: [/^\*\*([^*]+)$/],
      evaluate: (reference, groups) => {
        // Don't let subsequent lines overwrite the first.
        if (!filePath) {
          filePath = this.normalizePath(groups.filePath)
        }
      }
    }, {
      names: ['name'],
      patterns: [/^This is (.*),/],
      evaluate: (reference, groups) => {
        name = groups.name
      }
    }, {
      names: ['text'],
      patterns: [/^Package: (.*)$/i],
      evaluate: (reference, groups) => {
        messages.push({
          name,
          severity: 'info',
          text: groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      names: ['category', 'text'],
      patterns: [/^! (.+) Error: (.+?)\.?$/i],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      names: ['file', 'line', 'category', 'text'],
      patterns: [/^(\S.*):(\d+): (?:(.+) Error: )?(.+?)\.?$/i],
      evaluate: (reference, groups) => {
        const line: number = parseInt(groups.line, 10)
        const message: Message = {
          severity: 'error',
          name,
          text: groups.text,
          log: reference,
          source: {
            file: this.normalizePath(groups.file),
            range: { start: line, end: line }
          }
        }

        if (groups.category) message.category = groups.category

        messages.push(message)
      }
    }, {
      names: ['category', 'severity', 'text', 'line'],
      patterns: [/^(.+) (Warning|Info): +(.*?)(?: on input line (\d+)\.)?$/i],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: groups.severity.toLowerCase() === 'info' ? 'info' : 'warning',
          name,
          category: groups.category,
          text: groups.text,
          source: { file: filePath },
          log: reference
        }

        if (groups.line) {
          const line: number = parseInt(groups.line, 10)

          message.source = {
            file: filePath,
            range: { start: line, end: line }
          }
        }

        messages.push(message)
      }
    }, {
      names: ['package', 'text', 'line'],
      patterns: [/^\(([^()]+)\) +(.*?)(?: on input line (\d+)\.?)?$/],
      evaluate: (reference, groups) => {
        const message: Message = messages[messages.length - 1]
        if (message && message.category && message.category.endsWith(groups.package)) {
          message.text = `${message.text} ${groups.text}`
          if (message.log && message.log.range && reference.range) message.log.range.end = reference.range.end
          if (groups.line) {
            const line: number = parseInt(groups.line, 10)

            message.text = `${message.text}.`
            message.source = {
              file: filePath,
              range: { start: line, end: line }
            }
          }
        }
      }
    }, {
      // LaTeX3 error messages when -file-line-error is on
      names: ['file', 'line', 'category', 'text'],
      patterns: [
        /^!{48,50}$/,
        /^!$/,
        /^(.*):(\d+): (?:(.+) error: )?(.+?)\.?$/
      ],
      evaluate: (reference, groups) => {
        const line: number = parseInt(groups.line, 10)
        const message: Message = {
          severity: 'error',
          name,
          category: groups.category,
          source: {
            file: this.normalizePath(groups.file),
            range: { start: line, end: line }
          },
          text: groups.text,
          log: reference
        }

        messages.push(message)
      }
    }, {
      // LaTeX3 messages
      names: ['category', 'severity', 'text'],
      patterns: [
        /^[.*!]{48,50}$/,
        /^[.*!] (.*?) (info|warning|error): ("[^"]*")$/
      ],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: groups.severity.toLowerCase() === 'info' ? 'info' : 'warning',
          name,
          category: groups.category,
          source: { file: filePath },
          text: groups.text,
          log: reference
        }

        messages.push(message)
      }
    }, {
      // LaTeX3 continued message
      names: ['text', 'line'],
      patterns: [/^[.*!] (.*?)(?: on line (\d+)\.?)?$/],
      evaluate: (reference, groups) => {
        const message: Message = messages[messages.length - 1]
        if (message && groups.text !== 'Type <return> to continue.') {
          message.text = `${message.text} ${groups.text || '\n'}`
          if (message.log && message.log.range && reference.range) message.log.range.end = reference.range.end
          if (groups.line) {
            const line: number = parseInt(groups.line, 10)

            message.text = `${message.text}.`
            message.source = {
              file: filePath,
              range: { start: line, end: line }
            }
          }
        }
      }
    }, {
      // End of LaTeX3 message
      names: [],
      patterns: [/^[.*!]{48,50} *$/],
      evaluate: (reference, groups) => {
        const message: Message = messages[messages.length - 1]
        if (message && message.log && message.log.range && reference.range) {
          message.log.range.end = reference.range.end
        }
      }
    }, {
      names: ['text'],
      patterns: [/^(No file .*\.)$/],
      evaluate: (reference, groups) => {
        messages.push({
          severity: 'warning',
          name,
          text: groups.text,
          log: reference
        })
      }
    }, {
      names: ['filePath'],
      patterns: [/^Output written on "?([^"]+)"? \([^)]*\)\.$/],
      evaluate: (reference, groups) => {
        outputs.push(this.normalizePath(groups.filePath))
      }
    }], line => WRAPPED_LINE_PATTERN.test(line))

    for (const message of messages) {
      message.text = message.text.trim().replace(/ *\n+ */g, '\n').replace(/ +/g, ' ')
    }

    output.value = { outputs, messages }

    return true
  }
}
