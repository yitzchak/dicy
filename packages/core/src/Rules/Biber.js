/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Action, CommandOptions, Message } from '../types'

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
        if (file.value && file.value.messages &&
          file.value.messages.some((message: Message) => message.text.includes('run Biber') && message.text.includes(name))) {
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
      args: ['biber', '$DIR_0/$BASE_0'],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
    }
  }
}
