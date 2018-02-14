import File from '../File'
import Rule from '../Rule'
import { Action, CommandOptions, RuleDescription } from '../types'

export default class ZathuraCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]

  getActions (file?: File): Action[] {
    return this.hasResolvedOutput('$JOB.log-ZathuraCheck') ? [] : ['run']
  }

  constructCommand (): CommandOptions {
    return {
      command: 'zathura --version',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-ZathuraCheck'
    }
  }
}
