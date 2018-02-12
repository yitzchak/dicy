import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParsedLog, ParserMatch, RuleDescription } from '../types'

const MESSAGE_PATTERN = /^\s+--\s*(.*)$/

export default class ParseMakeIndexLog extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build', 'log'],
    phases: ['execute'],
    parameters: [['MakeIndexLog']]
  }]
  static defaultActions: Action[] = ['parse']

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedMakeIndexLog')
    if (!output) return false

    const name = 'makeindex'
    const parsedLog: ParsedLog = {
      messages: [],
      inputs: [],
      outputs: [],
      calls: []
    }

    await this.firstParameter.parse([{
      names: ['input'],
      patterns: [
        /^Scanning (?:style|input) file (.*?)[.]+done .*$/
      ],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.inputs.push(this.normalizePath(match.groups.input))
        parsedLog.messages.push({
          severity: 'info',
          name,
          text: match._,
          log: reference
        })
      }
    }, {
      names: ['output'],
      patterns: [
        /^(?:Output|Transcript) written in (.*?)\.*$/
      ],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.outputs.push(this.normalizePath(match.groups.output))
        parsedLog.messages.push({
          severity: 'info',
          name,
          text: match._,
          log: reference
        })
      }
    }, {
      names: ['text'],
      patterns: [
        /^(Nothing written in .*?\.)$/
      ],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          severity: 'warning',
          name,
          text: match.groups.text,
          log: reference
        })
      }
    }, {
      names: ['text'],
      patterns: [
        /^(Sorting entries.*)$/
      ],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        parsedLog.messages.push({
          severity: 'info',
          name,
          text: match.groups.text,
          log: reference
        })
      }
    }, {
      names: ['inputPath', 'inputLine', 'outputPath', 'outputLine', 'text'],
      patterns: [
        /## Warning \(input = (.+), line = (\d+); output = (.+), line = (\d+)\):/,
        MESSAGE_PATTERN
      ],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const line = parseInt(match.groups.inputLine, 10)
        parsedLog.messages.push({
          severity: 'warning',
          name: 'makeindex',
          text: match.groups.text,
          log: reference,
          source: {
            file: match.groups.inputPath,
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }, {
      names: ['category', 'file', 'line', 'text'],
      patterns: [
        /^[*!]+ (Input (?:index|style)) error \(file = (.+), line = (\d+)\):$/,
        MESSAGE_PATTERN
      ],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const line = parseInt(match.groups.line, 10)
        parsedLog.messages.push({
          severity: 'error',
          name: 'makeindex',
          text: match.groups.text,
          category: match.groups.category,
          log: reference,
          source: {
            file: match.groups.file,
            range: {
              start: line,
              end: line
            }
          }
        })
      }
    }])

    output.value = parsedLog

    return true
  }
}
