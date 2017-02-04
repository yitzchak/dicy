/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|Label(s) may have changed. Rerun|No file )/i

export default class LaTeX extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])

  async initialize () {
    await this.getResolvedInputs(['.fls-ParsedLaTeXFileListing', '.log-ParsedLaTeXLog'])
  }

  async addInputFileActions (file: File): Promise<void> {
    if (!this.constructor.commands.has(this.command) || !this.constructor.phases.has(this.phase)) {
      return
    }

    switch (file.type) {
      case 'ParsedLaTeXFileListing':
        if (file.hasBeenUpdated) {
          this.addAction(file, 'updateDependencies')
        }
        break
      case 'ParsedLaTeXLog':
        if (file.value && file.value.messages.some((message: Message) => RERUN_LATEX_PATTERN.test(message.text))) {
          this.addAction(file)
        }
        break
      default:
        await super.addInputFileActions(file)
        break
    }
  }

  async updateDependencies (): Promise<boolean> {
    const files = this.actions.get('updateDependencies')

    if (files) {
      for (const file of files.values()) {
        if (file.value) {
          const { inputs, outputs } = file.value
          if (inputs) {
            for (const input of await this.getInputs(inputs)) {
              await this.addInputFileActions(input)
            }
          }
          if (outputs) await this.getOutputs(outputs)
        }
      }
    }

    return true
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedInputs(['.aux'])
    await this.getResolvedOutputs(['.aux', '.fls', '.log', '.synctex.gz'])
    return true
  }

  constructProcessOptions (): Object {
    const options = super.constructProcessOptions()

    if (this.options.outputDirectory) {
      const paths = [
        path.resolve(this.buildState.rootPath, this.options.outputDirectory),
        ''
      ]

      if (options.env.TEXINPUTS) paths.shift(options.env.TEXINPUTS)
      options.env.TEXINPUTS = paths.join(':')
    }

    return options
  }

  constructCommand () {
    const args = [
      this.options.engine,
      '-interaction=batchmode',
      '-recorder'
    ]

    if (this.options.outputDirectory) {
      args.push(`-output-directory=${this.options.outputDirectory}`)
    }

    if (this.options.jobName) {
      args.push(`-jobname=${this.options.jobName}`)
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

    args.push(`${this.firstParameter.normalizedFilePath}`)

    return args
  }
}
