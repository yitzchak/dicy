import * as path from 'path'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import { Action, CommandOptions } from '../types'

export default class Biber extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['BiberControlFile'])]
  static description: string = 'Runs Biber to process bibliography files (bib) when need is detected.'

  async initialize () {
    await this.getResolvedInputs([
      '$OUTDIR/$JOB.log-ParsedLaTeXLog',
      '$DIR_0/$NAME_0.blg-ParsedBiberLog'
    ])
  }

  async getFileActions (file: File): Promise<Action[]> {
    switch (file.type) {
      case 'ParsedLaTeXLog':
        const { name } = path.parse(this.firstParameter.filePath)
        if (file.value && Log.hasRunMessage(file.value, 'Biber', name)) {
          return ['run']
        }
        break
      case 'ParsedBiberLog':
        return ['updateDependencies']
      default:
        return ['run']
    }
    return []
  }

  constructCommand (): CommandOptions {
    return {
      command: ['biber', '{{$FILEPATH_0}}'],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [{ file: '$DIR_0/$NAME_0.bbl' }, { file: '$DIR_0/$NAME_0.blg' }]
    }
  }
}
