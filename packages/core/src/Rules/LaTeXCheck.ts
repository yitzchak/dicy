import File from '../File'
import Rule from '../Rule'
import { Action, CommandOptions, RuleDescription } from '../types'

export default class LaTeXCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['discover'],
    phases: ['execute'],
    parameters: [['LaTeXDiscovery']]
  }]

  getActions (file?: File): Action[] {
    return this.firstParameter.value.current ? ['run', 'update'] : ['update']
  }

  constructCommand (): CommandOptions {
    return {
      command: [this.options.engine, '-version'],
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-LaTeXCheck'
    }
  }
}