import File from '../File'
import Rule from '../Rule'
import State from '../State'

import { CommandOptions, Command, OptionsInterface, Phase } from '../types'

export default class Agda extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['LiterateAgda'])]
  static description: string = 'Runs agda on lagda files.'

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: File[] = []): Promise<boolean> {
    // Only apply if the literate Agda engine is set to agda
    return options.literateAgdaEngine === 'agda'
  }

  constructCommand (): CommandOptions {
    // Force latex mode and save all file to root directory.
    return {
      args: ['agda', '--latex', '--latex-dir=.', '{{$BASE_0}}'],
      cd: '$ROOTDIR/$DIR_0',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.tex', '$DIR_0/$NAME_0.agdai', '$DIR_0/agda.sty']
    }
  }
}
