/* @flow */

import Rule from '../Rule'

import type { Command, Message, Phase } from '../types'

export default class ReportLogMessages extends Rule {
  static fileTypes: Set<string> = new Set(['BiberLog', 'BibTeXLog', 'LaTeXLog', 'MakeIndexLog'])
  static commands: Set<Command> = new Set(['report'])
  static phases: Set<Phase> = new Set(['finalize'])

  async evaluate () {
    if (this.firstParameter.contents) {
      for (const message: Message of this.firstParameter.contents.messages) {
        this.log(message)
      }
    }
    return true
  }
}
