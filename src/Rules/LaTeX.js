/* @flow */

import path from 'path'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Action, Command, Message, Phase } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|Label(s) may have changed. Rerun|No file )/i
const SUB_FILE_SUB_TYPES = ['subfile', 'standalone']

export default class LaTeX extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static description: string = 'Runs the required latex variant.'

  static async appliesToFile (buildState: BuildState, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return await super.appliesToFile(buildState, command, phase, jobName, file) &&
      (file.normalizedFilePath === buildState.filePath || !SUB_FILE_SUB_TYPES.includes(file.subType))
  }

  async initialize () {
    await this.getResolvedInputs(['.fls-ParsedLaTeXFileListing', '.log-ParsedLaTeXLog'])
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    switch (file.type) {
      case 'ParsedLaTeXFileListing':
        return ['updateDependencies']
      case 'ParsedLaTeXLog':
        if (file.value && file.value.messages &&
          file.value.messages.some((message: Message) => RERUN_LATEX_PATTERN.test(message.text))) {
          return ['run']
        }
        break
      default:
        return ['run']
    }
    return []
  }

  async updateDependencies (): Promise<boolean> {
    const files = this.actions.get('updateDependencies')

    if (files) {
      for (const file of files.values()) {
        if (file.value) {
          const { inputs, outputs } = file.value
          if (inputs) {
            for (const input of await this.getInputs(inputs)) {
              await this.addFileActions(input)
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
        path.resolve(this.rootPath, this.options.outputDirectory),
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
      '-file-line-error',
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
