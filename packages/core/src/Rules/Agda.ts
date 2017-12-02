import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase } from '../types'

export default class Agda extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['LiterateAgda'])]
  static description: string = 'Runs agda on lagda files.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if the literate Agda engine is set to agda
    return consumer.options.literateAgdaEngine === 'agda'
  }

  constructCommand (): CommandOptions {
    // Force latex mode and save all file to root directory.
    return {
      args: ['agda', '--latex', '--latex-dir=.', '{{$BASE_0}}'],
      cd: '$ROOTDIR/$DIR_0',
      severity: 'error',
      outputs: [
        { file: '$DIR_0/$NAME_0.tex' },
        { file: '$DIR_0/$NAME_0.agdai' },
        { file: '$DIR_0/agda.sty' }
      ]
    }
  }
}
