import Rule from '../Rule'
import { RuleDescription } from '../types'

export default class LogProducedTargets extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['finalize']
  }]
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true

  async run () {
    for (const target of await this.getTargets()) {
      this.info(`Produced ${target}`, 'target')
    }
    return true
  }
}
