import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Phase } from '../types'

export default class LhsToTeX extends Rule {
  static parameterTypes: Set<string>[] = [new Set([
    'LiterateHaskell',
    'LiterateAgda'
  ])]
  static description: string = 'Runs lhs2TeX on lhs or lagda files.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return parameters.some(file => ((file.type === 'LiterateHaskell' && consumer.options.literateHaskellEngine === 'lhs2TeX') ||
      (file.type === 'LiterateAgda' && consumer.options.literateAgdaEngine === 'lhs2TeX')))
  }

  constructCommand (): CommandOptions {
    const args = ['lhs2TeX']

    // If the source is a literate Agda file then add the `--agda` option
    if (this.firstParameter.type === 'LiterateAgda') {
      args.push('--agda')
    }

    // Add the style option. `poly` is default so omit it.
    switch (this.options.lhs2texStyle) {
      case 'math':
        args.push('--math')
        break
      case 'newCode':
        args.push('--newcode')
        break
      case 'code':
        args.push('--code')
        break
      case 'typewriter':
        args.push('--tt')
        break
      case 'verbatim':
        args.push('--verb')
        break
    }

    // Add the output file and source files.
    args.push('-o', '{{$DIR_0/$NAME_0.tex}}', '{{$FILEPATH_0}}')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [{ file: '$DIR_0/$NAME_0.tex' }]
    }
  }
}
