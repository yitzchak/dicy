/* @flow */

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
    if (this.constructor.commands.has(this.command) &&
      this.constructor.phases.has(this.phase) &&
      file.type === 'ParsedLaTeXLog') {
      if (file.value && file.value.messages.some((message: Message) => /run Biber/.test(message.text))) {
        this.addAction(file)
      }
    } else {
      await super.addInputFileActions(file)
    }
  }

  constructCommand () {
    return ['biber', this.firstParameter.normalizedFilePath]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['.bbl', '.blg'])
    return true
  }
}
