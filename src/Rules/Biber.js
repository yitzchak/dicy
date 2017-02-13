/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

export default class Biber extends Rule {
  static fileTypes: Set<string> = new Set(['BiberControlFile'])
  static description: string = 'Runs Biber to process bibliography files (bib) when need is detected.'

  async initialize () {
    await this.getResolvedInputs(['.log-ParsedLaTeXLog'])
  }

  async addInputFileActions (file: File): Promise<void> {
    switch (file.type) {
      case 'ParsedLaTeXLog':
        const { name } = path.parse(this.firstParameter.normalizedFilePath)
        if (this.constructor.commands.has(this.command) &&
          this.constructor.phases.has(this.phase) && file.value &&
          file.value.messages.some((message: Message) => message.text.includes('run Biber') && message.text.includes(name))) {
          this.addAction(file)
        }
        break
      default:
        await super.addInputFileActions(file)
        break
    }
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
