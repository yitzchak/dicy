/* @flow */

import _ from 'lodash'
import yargs from 'yargs-parser'

import type { Message, ParsedLog, ShellCall } from './types'

const ARGUMENT_PARSERS = {
  epstopdf: {
    alias: {
      outfile: 'o'
    },
    configuration: {
      'negation-prefix': 'no'
    },
    default: {
      compress: true,
      embed: true,
      gs: true,
      quiet: true,
      safer: true
    },
    boolean: [
      'compress',
      'debug',
      'embed',
      'exact',
      'filter',
      'gray',
      'gs',
      'hires',
      'quiet',
      'restricted',
      'safer'
    ],
    string: [
      'device',
      'pdfwrite',
      'autorotate',
      'gscmd',
      'gsopt',
      'gsopts',
      'outfile'
    ]
  },
  repstopdf: {
    alias: {
      outfile: 'o'
    },
    configuration: {
      'negation-prefix': 'no'
    },
    default: {
      compress: true,
      embed: true,
      gs: true,
      quiet: true,
      restricted: true,
      safer: true
    },
    boolean: [
      'compress',
      'debug',
      'embed',
      'exact',
      'filter',
      'gray',
      'gs',
      'hires',
      'quiet',
      'restricted',
      'safer'
    ],
    string: [
      'device',
      'pdfwrite',
      'autorotate',
      'gscmd',
      'gsopt',
      'gsopts',
      'outfile'
    ]
  },
  makeindex: {
    boolean: ['c', 'g', 'i', 'l', 'q', 'r', 'L', 'T'],
    string: ['o', 'p', 's', 't']
  },
  splitindex: {
    alias: {
      help: 'h',
      makeindex: 'm',
      identify: 'i',
      resultis: 'r',
      suffixis: 's'
    },
    string: ['makeindex', 'identify', 'resultis', 'suffixis'],
    count: ['verbose'],
    boolean: ['help', 'version']
  },
  texindy: {
    alias: {
      codepage: 'C',
      german: 'g',
      help: 'h',
      inputMarkup: 'I',
      language: 'L',
      letterOrdering: 'l',
      logFile: 't',
      module: 'M',
      noRanges: 'r',
      outFile: 'o',
      quiet: 'q',
      stdin: 'i',
      verbose: 'v',
      version: 'V'
    },
    boolean: [
      'german',
      'help',
      'letter-ordering',
      'no-ranges',
      'quiet',
      'stdin',
      'verbose',
      'version'
    ],
    string: [
      'codepage',
      'input-markup',
      'language',
      'log-file',
      'module',
      'out-file'
    ]
  }
}

function splitCommand (command: string) {
  const args: Array<string> = []
  let current: ?string
  let quote: ?string

  for (let i = 0; i < command.length; i++) {
    const char: string = command.substr(i, 1)
    if (char === quote) {
      quote = null
    } else if (char === '\'' || char === '"') {
      quote = char
      current = current || ''
    } else if (char === '\\') {
      current = `${current || ''}${command.substr(++i, 1)}`
    } else if (!quote && /^\s$/.test(char)) {
      if (typeof current === 'string') args.push(current)
      current = null
    } else {
      current = `${current || ''}${char}`
    }
  }

  if (typeof current === 'string') args.push(current)

  return args
}

export default class Log {
  // BibTeX/Biber run request
  static hasRunMessage (parsedLog: ParsedLog, program: string, file: string): boolean {
    const quote = file.includes(' ') ? '"' : ''
    const text = `run ${program} on the file: ${quote}${file}${quote}`
    return parsedLog.messages.findIndex(message => message.text.includes(text)) !== -1
  }

  static findMessage (parsedLog: ParsedLog, pattern: string | RegExp): ?Message {
    return parsedLog.messages.find(message => !!message.text.match(pattern))
  }

  static findMessageMatches (parsedLog: ParsedLog, pattern: RegExp, category?: string): Array<Array<string>> {
    return parsedLog.messages
      // $FlowIgnore
      .map(message => (!category || message.category === category) ? message.text.match(pattern) : null)
      .filter(match => match)
  }

  static filterCalls (parsedLog: ParsedLog, command: string | RegExp, filePath?: string, status?: string): Array<ShellCall> {
    return parsedLog.calls.filter(call => !!call.args[0].match(command) &&
      (!filePath || call.args.includes(filePath)) &&
      (!status || call.status.startsWith(status)))
  }

  static findCall (parsedLog: ParsedLog, command: string | RegExp, filePath?: string, status?: string): ?ShellCall {
    return parsedLog.calls.find(call => !!call.args[0].match(command) &&
      (!filePath || call.args.includes(filePath)) &&
      (!status || call.status.startsWith(status)))
  }

  static parseCall (command: string, status: string = 'executed'): ShellCall {
    const args = splitCommand(command)
    if (args[0] in ARGUMENT_PARSERS) {
      const argv = yargs(args, ARGUMENT_PARSERS[args[0]])
      return {
        args: argv._,
        options: _.omitBy(_.omitBy(_.omit(argv, ['_', '$0']), _.isUndefined), v => v === false),
        status
      }
    }

    return { args, options: {}, status }
  }
}
