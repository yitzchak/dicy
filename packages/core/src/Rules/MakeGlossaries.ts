import * as path from 'path'

import Rule from '../Rule'
import { CommandOptions } from '../types'

export default class MakeGlossaries extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['GlossaryControlFile'])]
  static description: string = 'Runs makeglossaries on any glossary files generated.'

  async initialize (): Promise<void> {
    await this.getResolvedInputs(['$DIR_0/$NAME_0.acn', '$DIR_0/$NAME_0.ist'])
  }

  constructCommand (): CommandOptions {
    const { dir, name } = path.parse(this.firstParameter.filePath)
    const command = ['makeglossaries']

    // Only push the -d option if needed.
    if (dir) command.push('-d', dir)
    command.push(name)

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [
        { file: '$DIR_0/$NAME_0.acr' },
        { file: '$DIR_0/$NAME_0.alg' },
        { file: '$DIR_0/$NAME_0.gls' },
        { file: '$DIR_0/$NAME_0.glg' }
      ]
    }
  }
}
