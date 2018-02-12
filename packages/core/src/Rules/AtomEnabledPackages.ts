import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class AtomEnabledPackages extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  constructCommand (): CommandOptions {
    return {
      command: ['apm', 'list', '--installed', '--packages', '--enabled', '--bare'],
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-AtomEnabledPackages'
    }
  }
}
