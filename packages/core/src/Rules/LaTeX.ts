import { Command } from '@dicy/types'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Action, CommandOptions, Phase, RuleDescription } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/
const JAPANESE_LATEX_PATTERN = /^u?platex$/
const RERUN_LATEX_PATTERN = /(rerun LaTeX|(?:Citation|Label)\(s\) may have changed\. Rerun|No file |Point totals have changed. Rerun to get point totals right.)/i
const SUB_FILE_SUB_TYPES = ['subfile', 'standalone']

export default class LaTeX extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['LaTeX', 'LiterateHaskell', 'LiterateAgda']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return parameters.some(file =>
      ((file.type === 'LaTeX' && (file.filePath === consumer.filePath || !SUB_FILE_SUB_TYPES.includes(file.subType || ''))) ||
      (file.type === 'LiterateHaskell' && consumer.options.literateHaskellEngine === 'none') ||
      (file.type === 'LiterateAgda' && consumer.options.literateAgdaEngine === 'none')))
  }

  async initialize () {
    await this.getResolvedInputs([
      '$OUTDIR/$JOB.fls-ParsedFileListing',
      '$OUTDIR/$JOB.log-ParsedLaTeXLog'
    ])
  }

  async getFileActions (file: File): Promise<Action[]> {
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
    const command = [
      engine,
      '-file-line-error',
      '-interaction=batchmode',
      '-recorder'
    ]

    if (this.options.outputDirectory) {
      command.push(`-output-directory=${this.options.outputDirectory}`)
    }

    if (this.options.jobName) {
      command.push(`-jobname=${this.options.jobName}`)
    }

    if (this.options.synctex) {
      command.push('-synctex=1')
    }

    switch (this.options.shellEscape) {
      case 'disabled':
        command.push('-no-shell-escape')
        break
      case 'restricted':
        command.push('-shell-restricted')
        break
      case 'enabled':
        command.push('-shell-escape')
        break
    }

    // xelatex uses a different option to specify dvi output since it runs
    // xdvipdfmx internally.
    if (PDF_CAPABLE_LATEX_PATTERN.test(engine)) {
      if (this.options.outputFormat !== 'pdf') {
        switch (this.options.engine) {
          case 'xelatex':
            command.push('-no-pdf')
            break
          default:
            command.push('-output-format=dvi')
            break
        }
      }
    }

    if (JAPANESE_LATEX_PATTERN.test(engine)) {
      if (this.options.kanji) {
        command.push(`-kanji=${this.options.kanji}`)
      }
      if (this.options.kanjiInternal) {
        command.push(`-kanji-internal=${this.options.kanjiInternal}`)
      }
    }

    // Add the source file.
    command.push('{{$FILEPATH_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: [{ file: '$OUTDIR/$JOB.aux' }],
      outputs: [
        { file: '$OUTDIR/$JOB.aux' },
        { file: '$OUTDIR/$JOB.fls' },
        { file: '$OUTDIR/$JOB.log' },
        { file: '$OUTDIR/$JOB.synctex.gz', type: 'target' },
        { file: '$OUTDIR/$JOB$OUTEXT', type: 'target' }
      ]
    }
  }
}
