/* @flow */

import Rule from '../Rule'

import type { Command, Message, ParsedLog } from '../types'

export default class ReportLogMessages extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set([
    'ParsedAsymptoteStdOut',
    'ParsedBiberLog',
    'ParsedBibTeXLog',
    'ParsedLaTeXLog',
    'ParsedMakeIndexLog',
    'ParsedSplitIndexStdErr',
    'ParsedSplitIndexStdOut'
  ])]
  static commands: Set<Command> = new Set(['log'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Reports log messages from any parsed log files.'

  async run () {
    const parsedLog: ?ParsedLog = this.firstParameter.value

    if (parsedLog) {
      for (const message: Message of parsedLog.messages) {
        this.log(message)
      }
    }
    return true
  }
}
