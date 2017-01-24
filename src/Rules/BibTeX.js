/* @flow */

import path from 'path'

import Rule from '../Rule'
import File from '../File'

export default class BibTeX extends Rule {
  static fileTypes: Set<string> = new Set(['ParsedLaTeXAuxilary'])

  input: ?File

  async initialize () {
    await this.getInput(this.resolveOutputPath('.log-ParsedLaTeXLog'))
  }

  async preEvaluate () {
    if (!this.input && !!this.firstParameter.value && !!this.firstParameter.value.bibdata) {
      this.input = await this.getInput(this.resolveOutputPath('.aux'))
    }

    if (!this.input) return false

    const triggers = Array.from(this.getTriggers())
    return triggers.length === 0 ||
      triggers.some(file => file.type !== 'ParsedLaTeXLog' || (file.value && file.value.messages && file.value.messages.some(message => message.text.match(/run BibTeX/))))
  }

  constructProcessOptions () {
    const options: Object = {
      cwd: this.rootPath
    }

    if (this.options.outputDirectory) {
      options.env = Object.assign({}, process.env, { BIBINPUTS: `.:${this.options.outputDirectory}` })
    }

    return options
  }

  constructCommand () {
    return `bibtex "${this.input ? this.input.normalizedFilePath : ''}"`
  }

  async postEvaluate (stdout: string, stderr: string) {
    const databasePattern = /^Database file #\d+: (.*)$/mg
    let match

    await this.addResolvedOutputs('.bbl', '.blg')

    while ((match = databasePattern.exec(stdout)) !== null) {
      await this.getInput(path.resolve(this.rootPath, match[1]))
      if (this.options.outputDirectory) {
        await this.getInput(path.resolve(this.rootPath, this.options.outputDirectory, match[1]))
      }
    }
  }
}
