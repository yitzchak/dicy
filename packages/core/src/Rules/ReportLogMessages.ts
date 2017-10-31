import Rule from '../Rule'

import { Command, ParsedLog } from '../types'

export default class ReportLogMessages extends Rule {
  static parameterTypes: Set<string>[] = [new Set([
    'ParsedAsymptoteStdOut',
    'ParsedBiberLog',
    'ParsedBibTeXLog',
    'ParsedLaTeXLog',
    'ParsedMakeIndexLog',
    'ParsedMendexLog',
    'ParsedMendexStdErr',
    'ParsedSplitIndexStdErr',
    'ParsedSplitIndexStdOut',
    'ParsedXindyLog'
  ])]
  static commands: Set<Command> = new Set<Command>(['log'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Reports log messages from any parsed log files.'

  async run () {
    const parsedLog: ParsedLog | undefined = this.firstParameter.value

    // Not much here, just log each message, if there are any.
    if (parsedLog && parsedLog.messages) {
      for (const message of parsedLog.messages) {
        this.log(message)
      }
    }
    return true
  }
}
