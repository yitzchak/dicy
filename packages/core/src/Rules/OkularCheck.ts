import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class OkularCheck extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

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
