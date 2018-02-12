import Rule from '../Rule'
import { RuleDescription } from '../types'

export default class FindLogFiles extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build', 'log'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  async run () {
    // Look for physical log files
    await this.getGlobbedFiles('$OUTDIR/$JOB.@(log|*lg)')
    return true
  }
}
