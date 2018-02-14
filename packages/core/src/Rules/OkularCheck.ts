import File from '../File'
import Rule from '../Rule'
import { Action, CommandOptions, RuleDescription } from '../types'

export default class OkularCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }, {
    commands: ['discover'],
    phases: ['execute'],
    parameters: [['OkularDiscovery']]
  }]

  getActions (file?: File): Action[] {
    if (this.command !== 'discover') {
      return this.hasResolvedOutput('$JOB.log-OkularCheck') ? [] : ['run']
    }

    return this.firstParameter.value.current ? ['run', 'update'] : ['update']
  }

  constructCommand (): CommandOptions {
    return {
      command: process.platform === 'win32'
        ? 'WHERE /Q okular.exe'
        : 'okular --version',
      cd: '$ROOTDIR',
      severity: 'info',
      stdout: '$JOB.log-OkularCheck'
    }
  }
}
