/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

export default class Biber extends Rule {
  static fileTypes: Set<string> = new Set(['BiberControlFile'])

  async initialize () {
    await this.addResolvedInputs('.log-ParsedLaTeXLog')
  }

  async addInputFileActions (file: File): Promise<void> {
    switch (file.type) {
      case 'ParsedLaTeXLog':
        if (file.value && file.value.messages.some((message: Message) => /run Biber/.test(message.text))) {
          this.actions.add('evaluate')
          file.hasTriggeredEvaluation = true
        }
        break
      default:
        await super.addInputFileActions(file)
        break
    }
  }

  constructCommand () {
    return `biber "${this.firstParameter.normalizedFilePath}"`
  }

  async postEvaluate (stdout: string, stderr: string) {
    await this.addResolvedOutputs('.bbl', '.blg')
  }
}
