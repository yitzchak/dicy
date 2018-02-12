import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class QpdfviewCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  constructCommand (): CommandOptions {
    return {
      command: 'qpdfview --help',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-QpdfviewCheck'
    }
  }
}
