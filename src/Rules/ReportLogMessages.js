/* @flow */

import Rule from '../Rule'

import type { Command, Message, Phase } from '../types'

export default class ReportLogMessages extends Rule {
  static fileTypes: Set<string> = new Set(['ParsedBiberLog', 'ParsedBibTeXLog', 'ParsedLaTeXLog', 'ParsedMakeIndexLog'])
  static commands: Set<Command> = new Set(['build', 'report'])
  static phases: Set<Phase> = new Set(['finalize'])
  static alwaysEvaluate: boolean = true

  async evaluate () {
    if (this.firstParameter.value) {
      for (const message: Message of this.firstParameter.value.messages) {
        this.log(message)
      }
    }
    return true
  }
}
