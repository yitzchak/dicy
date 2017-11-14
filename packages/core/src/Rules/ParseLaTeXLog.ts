import { Command, Message, Reference, Severity } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import Log from '../Log'
import { Action, ParsedLog, ParserMatch } from '../types'

const WRAPPED_LINE_PATTERN = /^.{76}[^.]{3}$/

const LATEX3_PARSING_MODE = 'latex3'

export default class ParseLaTeXLog extends Rule {
  static parameterTypes: Set<string>[] = [new Set<string>(['LaTeXLog'])]
  static commands: Set<Command> = new Set<Command>(['build', 'log'])
  static description: string = 'Parses the logs produced by all latex variants.'
  static defaultActions: Action[] = ['parse']

  /**
   * Parse the latex log.
   * @return {Promise<boolean>}  Status of rule evaluation
   */
  async parse (): Promise<boolean> {
    // Get the output file
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedLaTeXLog')
    if (!output) return false

    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }
    const name: string = this.firstParameter.subType || 'LaTeX'
    const sourcePaths: string[] = []

    await this.firstParameter.parse([{
      // Ignore intro line
      patterns: [/^This is/],
      /* tslint:disable:no-empty */
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {}
    }, {
      // Input file name
      names: ['filePath'],
      patterns: [/^\*\*([^*]+)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        // Don't let subsequent lines overwrite the first.
        if (sourcePaths.length === 0) {
          sourcePaths.unshift(this.normalizePath(match.groups.filePath))
        }
      }
    }, {
      // Package info message
      names: ['text'],
      patterns: [/^Package: (.*)$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          name,
          severity: 'info',
          text: match.groups.text,
          source: { file: sourcePaths[0] },
          log: reference
        })
      }
    }, {
      // Error messages when -file-line-error is off or no file reference is
      // included.
      names: ['category', 'text'],
      patterns: [/^! (.+) Error: (.+?)\.?$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          severity: 'error',
          name,
          category: match.groups.category,
          text: match.groups.text,
          source: { file: sourcePaths[0] },
          log: reference
        })
      }
    }, {
      // Error messages when -file-line-error is on and file reference is
      // available.
      names: ['file', 'line', 'category', 'text'],
      patterns: [/^(\S.*):(\d+): (?:(.+) Error: )?(.+?)\.?$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const line: number = parseInt(match.groups.line, 10)
        const message: Message = {
          severity: 'error',
          name,
          text: match.groups.text,
          log: reference,
          source: {
            file: this.normalizePath(match.groups.file),
            range: { start: line, end: line }
          }
        }

        if (match.groups.category) message.category = match.groups.category

        parsedLog.messages.push(message)
      }
    }, {
      // Warning/Info messages, possibly with a line reference.
      names: ['category', 'severity', 'text', 'line'],
      patterns: [/^(.+) (Warning|Info): +(.*?)(?: on input line (\d+)\.)?$/i],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const message: Message = {
          severity: match.groups.severity.toLowerCase() as Severity,
          name,
          category: match.groups.category,
          text: match.groups.text,
          source: { file: sourcePaths[0] },
          log: reference
        }

        // There is a line reference so add it to the message.
        if (match.groups.line) {
          const line: number = parseInt(match.groups.line, 10)

          message.source = {
            file: sourcePaths[0],
            range: { start: line, end: line }
          }
        }

        parsedLog.messages.push(message)
      }
    }, {
      // Continuation of message with possible file reference.
      names: ['package', 'text', 'line'],
      patterns: [/^\(([^()]+)\) {2,}(.*?)(?: on input line (\d+)\.?)?$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const message: Message = parsedLog.messages[parsedLog.messages.length - 1]
        // Verify that the previous message matches the category.
        if (message && message.category && message.category.endsWith(match.groups.package)) {
          message.text = `${message.text} ${match.groups.text}`
          // If the previous message has a log reference then extend it.
          if (message.log && message.log.range && reference.range) {
            message.log.range.end = reference.range.end
          }
          // If there is a line reference then add it the the message.
          if (match.groups.line) {
            const line: number = parseInt(match.groups.line, 10)

            message.text = `${message.text}.`
            message.source = {
              file: sourcePaths[0],
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
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const line: number = parseInt(match.groups.line, 10)
        const message: Message = {
          severity: 'error',
          name,
          source: {
            file: this.normalizePath(match.groups.file),
            range: { start: line, end: line }
          },
          text: match.groups.text,
          log: reference
        }

        if (match.groups.category) message.category = match.groups.category

        parsedLog.messages.push(message)

        return LATEX3_PARSING_MODE
      }
    }, {
      // LaTeX3 messages
      names: ['category', 'severity', 'text'],
      patterns: [
        /^[.*!]{48,50}$/,
        /^[.*!] (.*?) (info|warning|error): ("[^"]*")$/
      ],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const message: Message = {
          severity: match.groups.severity as Severity,
          name,
          category: match.groups.category,
          source: { file: sourcePaths[0] },
          text: match.groups.text,
          log: reference
        }

        parsedLog.messages.push(message)

        return LATEX3_PARSING_MODE
      }
    }, {
      // LaTeX3 continued message
      modes: [LATEX3_PARSING_MODE],
      names: ['text', 'line'],
      patterns: [/^[.*!] (.*?)(?: on line (\d+)\.?)?$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const message: Message = parsedLog.messages[parsedLog.messages.length - 1]
        if (message && message.log && message.log.range && reference.range) {
          // Don't add input requests to the message.
          if (match.groups.text !== 'Type <return> to continue.') {
            message.text = `${message.text} ${match.groups.text.trim() || '\n'}`
          }
          // If the the previous message has a log reference then extend it.
          if (message.log && message.log.range && reference.range) {
            message.log.range.end = reference.range.end
          }
          // If there is a line reference then add it to the message.
          if (match.groups.line) {
            const line: number = parseInt(match.groups.line, 10)

            message.text = `${message.text}.`
            message.source = {
              file: sourcePaths[0],
              range: { start: line, end: line }
            }
          }
        }
      }
    }, {
      // End of LaTeX3 message
      modes: [LATEX3_PARSING_MODE],
      names: [],
      patterns: [/^[.*!]{48,50} *$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const message: Message = parsedLog.messages[parsedLog.messages.length - 1]
        // If the the previous message has a log reference then extend it.
        if (message && message.log && message.log.range && reference.range) {
          message.log.range.end = reference.range.end
        }

        return File.DEFAULT_PARSING_MODE
      }
    }, {
      // Missing file warning.
      names: ['text'],
      patterns: [/^(No file .*\.)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          severity: 'warning',
          name,
          text: match.groups.text,
          log: reference
        })
      }
    }, {
      // makeidx/splitidx messages.
      names: ['text'],
      patterns: [/^(Writing index file.*|Using splitted index at.*|Started index file .*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          severity: 'info',
          name,
          text: match.groups.text,
          log: reference
        })
      }
    }, {
      // Output file message. This is especially important for XeLaTeX since
      // it does not put the output PDF file name into the FLS file.
      names: ['filePath'],
      patterns: [/^Output written on "?([^"]+)"? \([^)]*\)\.$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        // Sometimes XeLaTeX uses astricks instead of spaces in output path.
        parsedLog.outputs.push(this.normalizePath(match.groups.filePath.replace(/\*/g, ' ')))
      }
    }, {
      // Run system message.
      names: ['command', 'status'],
      patterns: [/^runsystem\((.*?)\)\.\.\.(.*?)\.$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.calls.push(Log.parseCall(match.groups.command, match.groups.status))
      }
    }, {
      // \input notification
      patterns: [/(\([^()[]+|\))/g],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const trimPattern = /(^\([\s"]*|[\s"]+$)/g
        for (const token of match.captures) {
          if (token === ')') {
            // Avoid popping main source file off of the stack.
            if (sourcePaths.length > 1) {
              sourcePaths.shift()
            }
          } else {
            sourcePaths.unshift(this.normalizePath(token.replace(trimPattern, '')))
          }
        }
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
