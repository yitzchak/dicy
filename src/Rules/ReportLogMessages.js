/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Command, Message, Phase } from '../types'

export default class ReportLogMessages extends Rule {
  static fileTypes: Set<string> = new Set(['ParsedBiberLog', 'ParsedBibTeXLog', 'ParsedLaTeXLog', 'ParsedMakeIndexLog'])
  static commands: Set<Command> = new Set(['build', 'report'])
  static phases: Set<Phase> = new Set(['finalize'])
  static alwaysEvaluate: boolean = true

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return (buildState.command === 'report' || buildState.options.reportLogMessages) &&
      await super.appliesToFile(buildState, jobName, file)
  }

  async evaluate () {
    if (this.firstParameter.value) {
      this.actionTrace()
      // $FlowIgnore
      for (const message: Message of this.firstParameter.value.messages) {
        this.log(message)
      }
    }
    return true
  }
}
