/* @flow */

import path from 'path'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

export default class BibTeX extends Rule {
  static fileTypes: Set<string> = new Set(['ParsedLaTeXAuxilary'])

  input: ?File

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    if (!await super.appliesToFile(buildState, jobName, file)) return false
    return !!file.value && !!file.value.bibdata
  }

  async initialize () {
    await this.getGeneratedInput('.log-ParsedLaTeXLog')
    this.input = await this.getGeneratedInput('.aux')
  }

  async addInputFileActions (file: File): Promise<void> {
    switch (file.type) {
      case 'ParsedLaTeXLog':
        if (file.value && file.value.messages.some((message: Message) => /run BibTeX/.test(message.text))) {
          this.addAction(file)
        }
        break
      case 'ParsedLaTeXAuxilary':
        break
      default:
        await super.addInputFileActions(file)
        break
    }
  }

  async preEvaluate () {
    if (!this.input) this.actions.delete('run')
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

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    const databasePattern = /^Database file #\d+: (.*)$/mg
    let match

    await this.getGeneratedOutputs('.bbl', '.blg')

    while ((match = databasePattern.exec(stdout)) !== null) {
      await this.getInput(path.resolve(this.rootPath, match[1]))
      if (this.options.outputDirectory) {
        await this.getInput(path.resolve(this.rootPath, this.options.outputDirectory, match[1]))
      }
    }

    return true
  }
}
