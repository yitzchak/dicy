/* @flow */

import path from 'path'
import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|Label(s) may have changed. Rerun|No file )/i

export default class LaTeX extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static exclusive: boolean = true

  async initialize () {
    await this.addResolvedInputs('.fls-ParsedLaTeXFileListing', '.log-ParsedLaTeXLog')
  }

  async addInputFileActions (file: File): Promise<void> {
    switch (file.type) {
      case 'ParsedLaTeXFileListing':
        this.actions.add('dependencies')
        file.hasTriggeredEvaluation = true
        break
      case 'ParsedLaTeXLog':
        if (file.value && file.value.messages.some((message: Message) => RERUN_LATEX_PATTERN.test(message.text))) {
          this.actions.add('evaluate')
          file.hasTriggeredEvaluation = true
        }
        break
      default:
        await super.addInputFileActions(file)
        break
    }
  }

  async preEvaluate () {
    if (this.actions.has('dependencies')) {
      this.trace(`Update ${this.id} dependencies...`)
      const file = await this.getResolvedInput('.fls-ParsedLaTeXFileListing')
      if (file && file.value) {
        if (file.value.inputs) {
          for (const input of file.value.inputs) {
            const inputFile = await this.getInput(input)
            if (inputFile) await this.addInputFileActions(inputFile)
          }
        }
        if (file.value.outputs) await this.addOutputs(file.value.outputs)
      }
    }

    return true
  }

  async postEvaluate (stdout: string, stderr: string) {
    await this.addResolvedInputs('.aux')
    await this.addResolvedOutputs('.aux', '.fls', '.log')
  }

  constructCommand () {
    const args = [
      '-interaction=batchmode',
      '-recorder'
    ]

    if (this.options.outputDirectory) {
      args.push(`-output-directory="${this.options.outputDirectory}"`)
    }

    if (this.options.jobName) {
      args.push(`-jobname="${this.options.jobName}"`)
    }

    if (this.options.synctex) {
      args.push('-synctex=1')
    }

    switch (this.options.shellEscape) {
      case 'disable':
        args.push('-no-shell-escape')
        break
      case 'restricted':
        args.push('-shell-restricted')
        break
      case 'enable':
        args.push('-shell-escape')
        break
    }

    if (PDF_CAPABLE_LATEX_PATTERN.test(this.options.engine)) {
      if (this.options.outputFormat !== 'pdf') {
        switch (this.options.engine) {
          case 'xelatex':
            args.push('-no-pdf')
            break
          default:
            args.push('-output-format=dvi')
            break
        }
      }
    }

    args.push(`"${path.basename(this.firstParameter.filePath)}"`)

    return `${this.options.engine} ${args.join(' ')}`
  }
}
