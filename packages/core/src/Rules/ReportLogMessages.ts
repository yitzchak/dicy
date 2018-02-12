import Rule from '../Rule'
import { ParsedLog, RuleDescription } from '../types'

export default class ReportLogMessages extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['log'],
    phases: ['execute'],
    parameters: [[
      'ParsedAsymptoteStdOut', 'ParsedBiberLog', 'ParsedBibTeXLog',
      'ParsedLaTeXLog', 'ParsedMakeIndexLog', 'ParsedMendexLog',
      'ParsedMendexStdErr', 'ParsedSplitIndexStdErr', 'ParsedSplitIndexStdOut',
      'ParsedXindyLog'
    ]]
  }]
  static alwaysEvaluate: boolean = true

  async run () {
    const parsedLog: ParsedLog | undefined = this.firstParameter.value

    // Not much here, just log each message, if there are any.
    if (parsedLog && parsedLog.messages) {
      this.log(...parsedLog.messages)
    }
    return true
  }
}
