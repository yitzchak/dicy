/* @flow */

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, Phase } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|Label\(s\) may have changed\. Rerun|No file )/i
const SUB_FILE_SUB_TYPES = ['subfile', 'standalone']

export default class LaTeX extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set([
    'LaTeX',
    'LiterateHaskell',
    'LiterateAgda'
  ])]
  static description: string = 'Runs the required latex variant.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    return parameters.some(file =>
      ((file.type === 'LaTeX' && (file.filePath === state.filePath || !SUB_FILE_SUB_TYPES.includes(file.subType))) ||
      (file.type === 'LiterateHaskell' && state.getOption('literateHaskellEngine', jobName) === 'none') ||
      (file.type === 'LiterateAgda' && state.getOption('literateAgdaEngine', jobName) === 'none')))
  }

  async initialize () {
    await this.getResolvedInputs([
      '$OUTDIR/$JOB.fls-ParsedFileListing',
      '$OUTDIR/$JOB.log-ParsedLaTeXLog'
    ])
    await this.addResolvedTargets([
      '$OUTDIR/$JOB$OUTEXT',
      '$OUTDIR/$JOB.synctex.gz'
    ])
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    switch (file.type) {
      case 'ParsedFileListing':
        return ['updateDependencies']
      case 'ParsedLaTeXLog':
        // If a rerun instruction is found then return run, otherwise just
        // return updateDependencies.
        return (file.value && !!Log.findMessage(file.value, RERUN_LATEX_PATTERN))
          ? ['updateDependencies', 'run']
          : ['updateDependencies']
      default:
        return ['run']
    }
  }

  constructCommand (): CommandOptions {
    // Add engine and common options
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

    // xelatex uses a different option to specify dvi output since it runs
    // xdvipdfmx internally.
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

    // Add the source file.
    args.push('$DIR_0/$BASE_0')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: ['$OUTDIR/$JOB.aux'],
      outputs: [
        '$OUTDIR/$JOB.aux',
        '$OUTDIR/$JOB.fls',
        '$OUTDIR/$JOB.log',
        '$OUTDIR/$JOB.synctex.gz'
      ]
    }
  }
}
