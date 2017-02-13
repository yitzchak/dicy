/* @flow */

import path from 'path'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

export default class BibTeX extends Rule {
  static fileTypes: Set<string> = new Set(['ParsedLaTeXAuxilary'])
  static description: string = 'Runs BibTeX to process bibliography files (bib) when need is detected.'

  input: ?File

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    if (!await super.appliesToFile(buildState, jobName, file)) return false
    return !!file.value && !!file.value.bibdata
  }

  async initialize () {
    await this.getResolvedInput('.log-ParsedLaTeXLog')
    this.input = await this.getResolvedInput('.aux', {
      referenceFile: this.firstParameter,
      useJobName: false,
      useOutputDirectory: false
    })
  }

  async addInputFileActions (file: File): Promise<void> {
    switch (file.type) {
      case 'ParsedLaTeXLog':
        const { name } = path.parse(this.firstParameter.normalizedFilePath)
        if (this.constructor.commands.has(this.command) &&
          this.constructor.phases.has(this.phase) && file.value &&
          file.value.messages.some((message: Message) => message.text.includes('run BibTeX') && message.text.includes(name))) {
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
      options.env = Object.assign({}, process.env, { BIBINPUTS: ['.', this.options.outputDirectory].join(path.delimiter) })
    }

    return options
  }

  constructCommand () {
    return ['bibtex', this.input ? this.input.normalizedFilePath : '']
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    const databasePattern = /^Database file #\d+: (.*)$/mg
    let match

    await this.getResolvedOutputs(['.bbl', '.blg'], {
      fileReference: this.firstParameter,
      useJobName: false,
      useOutputDirectory: false
    })

    while ((match = databasePattern.exec(stdout)) !== null) {
      await this.getInput(path.resolve(this.rootPath, match[1]))
      if (this.options.outputDirectory) {
        await this.getInput(path.resolve(this.rootPath, this.options.outputDirectory, match[1]))
      }
    }

    return true
  }
}
