import * as path from 'path'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'

import { Action, CommandOptions } from '../types'

export default class Biber extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BiberControlFile'])]
  static description: string = 'Runs Biber to process bibliography files (bib) when need is detected.'

  async initialize () {
    await this.getResolvedInputs([
      '$OUTDIR/$JOB.log-ParsedLaTeXLog',
      '$DIR_0/$NAME_0.blg-ParsedBiberLog'
    ])
  }

  async getFileActions (file: File): Promise<Array<Action>> {
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
      args: ['biber', '{{$FILEPATH_0}}'],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
    }
  }
}
