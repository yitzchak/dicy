/* @flow */

import path from 'path'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, Phase } from '../types'

const JAPANESE_BIBTEX_PATTERN = /^u?pbibtex$/

export default class BibTeX extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set(['LaTeXAuxilary']),
    new Set(['ParsedLaTeXAuxilary'])
  ]
  static description: string = 'Runs BibTeX to process bibliography files (bib) when need is detected.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    return state.isGrandparentOf(parameters[0], parameters[1]) &&
      !!parameters[1].value && !!parameters[1].value.bibdata
  }

  async initialize () {
    await this.getResolvedInputs([
      '$OUTDIR/$JOB.log-ParsedLaTeXLog',
      '$DIR_0/$NAME_0.blg-ParsedBibTeXLog',
      '$FILEPATH_0'
    ])
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    switch (file.type) {
      case 'ParsedLaTeXLog':
        const { name } = path.parse(this.firstParameter.filePath)
        if (file.value && Log.hasRunMessage(file.value, 'BibTeX', name)) {
          return ['run']
        }
        break
      case 'ParsedBibTeXLog':
        return ['updateDependencies']
      case 'LaTeXAuxilary':
        return ['run']
    }

    return []
  }

  constructCommand (): CommandOptions {
    const engine = this.options.bibtexEngine
    const args = [engine]

    if (JAPANESE_BIBTEX_PATTERN.test(engine)) {
      if (this.options.kanji) {
        args.push(`-kanji=${this.options.kanji}`)
      }
      if (this.options.kanjiInternal) {
        args.push(`-kanji-internal=${this.options.kanjiInternal}`)
      }
    }

    args.push('{{$BASE_0}}')

    return {
      args,
      cd: '$ROOTDIR/$DIR_0',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
    }
  }
}
