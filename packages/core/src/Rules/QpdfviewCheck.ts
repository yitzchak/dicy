import File from '../File'
import Rule from '../Rule'
import { Action, CommandOptions, RuleDescription } from '../types'

export default class QpdfviewCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]

  getActions (file?: File): Action[] {
    return this.hasResolvedOutput('$JOB.log-QpdfviewCheck') ? [] : ['run']
  }

  constructCommand (): CommandOptions {
    return {
      command: 'qpdfview --help',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-QpdfviewCheck'
    }
  }
}
