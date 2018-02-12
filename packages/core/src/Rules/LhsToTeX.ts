import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase, RuleDescription } from '../types'

export default class LhsToTeX extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['LiterateHaskell', 'LiterateAgda']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return parameters.some(file => ((file.type === 'LiterateHaskell' && consumer.options.literateHaskellEngine === 'lhs2TeX') ||
      (file.type === 'LiterateAgda' && consumer.options.literateAgdaEngine === 'lhs2TeX')))
  }

  constructCommand (): CommandOptions {
    const command = ['lhs2TeX']

    // If the source is a literate Agda file then add the `--agda` option
    if (this.firstParameter.type === 'LiterateAgda') {
      command.push('--agda')
    }

    // Add the style option. `poly` is default so omit it.
    switch (this.options.lhs2texStyle) {
      case 'math':
        command.push('--math')
        break
      case 'newCode':
        command.push('--newcode')
        break
      case 'code':
        command.push('--code')
        break
      case 'typewriter':
        command.push('--tt')
        break
      case 'verbatim':
        command.push('--verb')
        break
    }

    // Add the output file and source files.
    command.push('-o', '{{$DIR_0/$NAME_0.tex}}', '{{$FILEPATH_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [{ file: '$DIR_0/$NAME_0.tex' }]
    }
  }
}
