/* @flow */

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, OptionsInterface, Phase } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const JAPANESE_LATEX_PATTERN = /^u?platex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|(?:Citation|Label)\(s\) may have changed\. Rerun|No file |Point totals have changed. Rerun to get point totals right.)/i
const SUB_FILE_SUB_TYPES = ['subfile', 'standalone']

export default class LaTeX extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set([
    'LaTeX',
    'LiterateHaskell',
    'LiterateAgda'
  ])]
  static description: string = 'Runs the required latex variant.'

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: Array<File> = []): Promise<boolean> {
    return parameters.some(file =>
      ((file.type === 'LaTeX' && (file.filePath === state.filePath || !SUB_FILE_SUB_TYPES.includes(file.subType))) ||
      (file.type === 'LiterateHaskell' && options.literateHaskellEngine === 'none') ||
      (file.type === 'LiterateAgda' && options.literateAgdaEngine === 'none')))
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
    const engine = this.options.engine
    // Add engine and common options
    const args = [
      engine,
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
    if (PDF_CAPABLE_LATEX_PATTERN.test(engine)) {
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

    if (JAPANESE_LATEX_PATTERN.test(engine)) {
      if (this.options.kanji) {
        args.push(`-kanji=${this.options.kanji}`)
      }
      if (this.options.kanjiInternal) {
        args.push(`-kanji-internal=${this.options.kanjiInternal}`)
      }
    }

    // Add the source file.
    args.push('{{$FILEPATH_0}}')

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
