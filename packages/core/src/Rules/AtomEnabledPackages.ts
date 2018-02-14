import File from '../File'
import Rule from '../Rule'
import { Action, CommandOptions, RuleDescription } from '../types'

export default class AtomEnabledPackages extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]

  getActions (file?: File): Action[] {
    return this.hasResolvedOutput('$JOB.log-AtomEnabledPackages') ? [] : ['run']
  }

  constructCommand (): CommandOptions {
    return {
      command: ['apm', 'list', '--installed', '--packages', '--enabled', '--bare'],
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-AtomEnabledPackages'
    }
  }
}
