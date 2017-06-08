/* @flow */

import path from 'path'

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Action, Command, Message, Phase } from '../types'

export default class BibTeX extends Rule {
  static fileTypes: Set<string> = new Set(['ParsedLaTeXAuxilary'])
  static description: string = 'Runs BibTeX to process bibliography files (bib) when need is detected.'

  input: ?File
  hasRun: boolean

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return await super.appliesToFile(state, command, phase, jobName, file) &&
      !!file.value && !!file.value.bibdata
  }

  async initialize () {
    await this.getResolvedInput('$OUTDIR/$JOB.log-ParsedLaTeXLog')
    this.input = await this.getResolvedInput('$DIR/$NAME.aux', this.firstParameter)
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    if (this.hasRun) return []

    switch (file.type) {
      case 'ParsedLaTeXLog':
        const { name } = path.parse(this.firstParameter.filePath)
        if (file.value && file.value.messages &&
          file.value.messages.some((message: Message) => message.text.includes('run BibTeX') && message.text.includes(name))) {
          return ['run']
        }
        break
      default:
        return ['run']
    }

    return []
  }

  async preEvaluate () {
    if (!this.input) this.actions.delete('run')
  }

  constructCommand () {
    return {
      args: ['bibtex', this.input ? this.input.filePath : ''],
      severity: 'error'
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    this.hasRun = true
    const databasePattern = /^Database file #\d+: (.*)$/mg
    let match

    await this.getResolvedOutputs(['$DIR/$NAME.bbl', '$DIR/$NAME.blg'], this.firstParameter)

    while ((match = databasePattern.exec(stdout)) !== null) {
      await this.getInput(path.resolve(this.rootPath, match[1]))
      if (this.options.outputDirectory) {
        await this.getInput(path.resolve(this.rootPath, this.options.outputDirectory, match[1]))
      }
    }

    return true
  }
}
