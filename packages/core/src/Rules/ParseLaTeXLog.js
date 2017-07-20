/* @flow */

import Rule from '../Rule'

import type { Action, Command, Message, ParsedLog } from '../types'

const WRAPPED_LINE_PATTERN = /^.{76}[^.]{3}$/

export default class ParseLaTeXLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LaTeXLog'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses the logs produced by all latex variants.'
  static defaultActions: Array<Action> = ['parse']

  /**
   * Parse the latex log.
   * @return {Promise<boolean>}  Status of rule evaluation
   */
  async parse (): Promise<boolean> {
    // Get the output file
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedLaTeXLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }
    let name: string
    let filePath: string

    await this.firstParameter.parse([{
      // Input file name
      names: ['filePath'],
      patterns: [/^\*\*([^*]+)$/],
      evaluate: (reference, groups) => {
        // Don't let subsequent lines overwrite the first.
        if (!filePath) {
          filePath = this.normalizePath(groups.filePath)
        }
      }
    }, {
      // Program identifier
      names: ['name'],
      patterns: [/^This is (.*),/],
      evaluate: (reference, groups) => {
        name = groups.name
      }
    }, {
      // Package info message
      names: ['text'],
      patterns: [/^Package: (.*)$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Error messages when -file-line-error is off or no file reference is
      // included.
      names: ['category', 'text'],
      patterns: [/^! (.+) Error: (.+?)\.?$/i],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          severity: 'error',
          name,
          category: groups.category,
          text: groups.text,
          source: { file: filePath },
          log: reference
        })
      }
    }, {
      // Error messages when -file-line-error is on and file reference is
      // available.
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

        parsedLog.messages.push(message)
      }
    }, {
      // Warning/Info messages, possibly with a line reference.
      names: ['category', 'severity', 'text', 'line'],
      patterns: [/^(.+) (Warning|Info): +(.*?)(?: on input line (\d+)\.)?$/i],
      evaluate: (reference, groups) => {
        const message: Message = {
          severity: groups.severity.toLowerCase(),
          name,
          category: groups.category,
          text: groups.text,
          source: { file: filePath },
          log: reference
        }

        // There is a line reference so add it to the message.
        if (groups.line) {
          const line: number = parseInt(groups.line, 10)

          message.source = {
            file: filePath,
            range: { start: line, end: line }
          }
        }

        parsedLog.messages.push(message)
      }
    }, {
      // Continuation of message with possible file reference.
      names: ['package', 'text', 'line'],
      patterns: [/^\(([^()]+)\) +(.*?)(?: on input line (\d+)\.?)?$/],
      evaluate: (reference, groups) => {
        const message: Message = parsedLog.messages[parsedLog.messages.length - 1]
        // Verify that the previous message matches the category.
        if (message && message.category && message.category.endsWith(groups.package)) {
          message.text = `${message.text} ${groups.text}`
          // If the previous message has a log reference then extend it.
          if (message.log && message.log.range && reference.range) {
            message.log.range.end = reference.range.end
          }
          // If there is a line reference then add it the the message.
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
          source: {
            file: this.normalizePath(groups.file),
            range: { start: line, end: line }
          },
          text: groups.text,
          log: reference
        }

        if (groups.category) message.category = groups.category

        parsedLog.messages.push(message)
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
          severity: groups.severity,
          name,
          category: groups.category,
          source: { file: filePath },
          text: groups.text,
          log: reference
        }

        parsedLog.messages.push(message)
      }
    }, {
      // LaTeX3 continued message
      names: ['text', 'line'],
      patterns: [/^[.*!] (.*?)(?: on line (\d+)\.?)?$/],
      evaluate: (reference, groups) => {
        const message: Message = parsedLog.messages[parsedLog.messages.length - 1]
        if (message) {
          // Don't add input requests to the message.
          if (groups.text !== 'Type <return> to continue.') {
            message.text = `${message.text} ${groups.text.trim() || '\n'}`
          }
          // If the the previous message has a log reference then extend it.
          if (message.log && message.log.range && reference.range) {
            message.log.range.end = reference.range.end
          }
          // If there is a line reference then add it to the message.
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
        const message: Message = parsedLog.messages[parsedLog.messages.length - 1]
        // If the the previous message has a log reference then extend it.
        if (message && message.log && message.log.range && reference.range) {
          message.log.range.end = reference.range.end
        }
      }
    }, {
      // Missing file warning.
      names: ['text'],
      patterns: [/^(No file .*\.)$/],
      evaluate: (reference, groups) => {
        parsedLog.messages.push({
          severity: 'warning',
          name,
          text: groups.text,
          log: reference
        })
      }
    }, {
      // Output file message.
      names: ['filePath'],
      patterns: [/^Output written on "?([^"]+)"? \([^)]*\)\.$/],
      evaluate: (reference, groups) => {
        parsedLog.outputs.push(this.normalizePath(groups.filePath))
      }
    }, {
      // Run system message.
      names: ['command', 'status'],
      patterns: [/^runsystem\((.*?)\)\.\.\.(.*?)\.$/],
      evaluate: (reference, groups) => {
        parsedLog.calls.push({
          command: groups.command,
          status: groups.status
        })
      }
    }], line => WRAPPED_LINE_PATTERN.test(line))

    // Clean the message text up.
    for (const message of parsedLog.messages) {
      message.text = message.text.trim().replace(/ *\n+ */g, '\n').replace(/ +/g, ' ')
    }

    output.value = parsedLog

    return true
  }
}
