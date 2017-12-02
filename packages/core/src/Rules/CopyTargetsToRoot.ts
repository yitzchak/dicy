import * as path from 'path'

import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase } from '../types'

export default class CopyTargetsToRoot extends Rule {
  static parameterTypes: Set<string>[] = [new Set<string>(['*'])]
  static description: string = 'Copy targets to root directory.'
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return consumer.options.copyTargetsToRoot &&
      parameters.every(file => !file.virtual && consumer.isOutputTarget(file) && path.dirname(file.filePath) !== '.')
  }

  async run () {
    // Copy the target to it's new location and add the result as an output.
    const filePath = this.resolvePath('$ROOTDIR/$BASE_0')
    await this.firstParameter.copy(filePath)
    await this.getInput(this.firstParameter.filePath, 'target')
    await this.getOutput(filePath, 'target')

    return true
  }
}
