/* @flow */

import path from 'path'
import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|Label(s) may have changed. Rerun|run \(pdf\)latex)/

export default class LaTeX extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])

  async initialize () {
    await this.addResolvedInputs('.fls-ParsedLaTeXFileListing', '.log-ParsedLaTeXLog')
  }

  async preEvaluate () {
    let run = Array.from(this.getTriggers()).length === 0

    for (const file: File of this.getTriggers()) {
      switch (file.type) {
        case 'ParsedLaTeXFileListing':
          await this.updateDependencies(file)
          break
        case 'ParsedLaTeXLog':
          if (file.value) {
            run = run || file.value.messages.some((message: Message) => RERUN_LATEX_PATTERN.test(message.text))
          }
          break
        default:
          run = true
      }
    }

    return run
  }

  async postEvaluate (stdout: string, stderr: string) {
    await this.addResolvedOutputs('.fls', '.log')
  }

  async updateDependencies (file: File) {
    if (file.value) {
      this.trace(`Update ${this.id} dependencies...`)
      if (file.value && file.value.inputs) await this.addInputs(file.value.inputs)
      if (file.value && file.value.outputs) await this.addOutputs(file.value.outputs)
    }
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
