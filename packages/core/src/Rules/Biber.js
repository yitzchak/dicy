/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Action, CommandOptions, Message } from '../types'

export default class Biber extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['BiberControlFile'])]
  static description: string = 'Runs Biber to process bibliography files (bib) when need is detected.'

  async initialize () {
    await this.getResolvedInput('$OUTDIR/$JOB.log-ParsedLaTeXLog')
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
      default:
        return ['run']
    }
    return []
  }

  constructCommand (): CommandOptions {
    return {
      args: ['biber', this.firstParameter.filePath],
      cd: '$ROOTDIR',
      severity: 'error'
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg'])
    return true
  }
}
