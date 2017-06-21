/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

export default class ReportLogMessages extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set([
    'ParsedAsymptoteLog',
    'ParsedBiberLog',
    'ParsedBibTeXLog',
    'ParsedLaTeXLog',
    'ParsedMakeIndexLog'
  ])]
  static commands: Set<Command> = new Set(['log'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Reports log messages from any parsed log files.'

  async run () {
    if (this.firstParameter.value) {
      for (const message: Message of this.firstParameter.value.messages) {
        this.log(message)
      }
    }
    return true
  }
}
