/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Action, Command, Message, Phase } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|Label\(s\) may have changed\. Rerun|No file )/i
const SUB_FILE_SUB_TYPES = ['subfile', 'standalone']

export default class LaTeX extends Rule {
  static fileTypes: Array<Set<string>> = [new Set(['LaTeX'])]
  static description: string = 'Runs the required latex variant.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return await super.appliesToFile(state, command, phase, jobName, file) &&
      (file.filePath === state.filePath || !SUB_FILE_SUB_TYPES.includes(file.subType))
  }

  async initialize () {
    await this.getResolvedInputs(['$OUTDIR/$JOB.fls-ParsedLaTeXFileListing', '$OUTDIR/$JOB.log-ParsedLaTeXLog'])
    await this.addResolvedTargets(['$OUTDIR/$JOB$OUTEXT', '$OUTDIR/$JOB.synctex.gz'])
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    switch (file.type) {
      case 'ParsedLaTeXFileListing':
        return ['updateDependencies']
      case 'ParsedLaTeXLog':
        if (file.value && file.value.messages &&
          file.value.messages.some((message: Message) => RERUN_LATEX_PATTERN.test(message.text))) {
          return ['updateDependencies', 'run']
        }
        break
      default:
        return ['run']
    }
    return []
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedInput('$OUTDIR/$JOB.aux')
    await this.getResolvedOutputs(['$OUTDIR/$JOB.aux', '$OUTDIR/$JOB.fls', '$OUTDIR/$JOB.log', '$OUTDIR/$JOB.synctex.gz'])
    return true
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
      case false:
      case 'disabled':
        args.push('-no-shell-escape')
        break
      case 'restricted':
        args.push('-shell-restricted')
        break
      case true:
      case 'enabled':
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

    args.push(this.firstParameter.filePath)

    return {
      args,
      severity: 'error'
    }
  }
}
