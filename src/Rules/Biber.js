/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Action, Message } from '../types'

export default class Biber extends Rule {
  static fileTypes: Set<string> = new Set(['BiberControlFile'])
  static description: string = 'Runs Biber to process bibliography files (bib) when need is detected.'

  async initialize () {
    await this.getResolvedInputs(['.log-ParsedLaTeXLog'])
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    switch (file.type) {
      case 'ParsedLaTeXLog':
        const { name } = path.parse(this.firstParameter.normalizedFilePath)
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

  constructCommand () {
    return ['biber', this.firstParameter.normalizedFilePath]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['.bbl', '.blg'], {
      fileReference: this.firstParameter,
      useJobName: false,
      useOutputDirectory: false
    })
    return true
  }
}
