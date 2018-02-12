import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class ZathuraCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  constructCommand (): CommandOptions {
    return {
      command: 'zathura --version',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-ZathuraCheck'
    }
  }
}
