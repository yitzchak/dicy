import Rule from '../Rule'
import { Phase } from '../types'

export default class LogProducedTargets extends Rule {
  static phases: Set<Phase> = new Set<Phase>(['finalize'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Reports produced targets.'

  async run () {
    for (const target of await this.getTargetPaths()) {
      this.info(`Produced \`${target}\``, 'target')
    }
    return true
  }
}
