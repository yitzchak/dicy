/* @flow */

import path from 'path'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, Phase } from '../types'

export default class BibTeX extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['ParsedLaTeXAuxilary'])]
  static description: string = 'Runs BibTeX to process bibliography files (bib) when need is detected.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    return parameters.some(file => !!file.value && !!file.value.bibdata)
  }

  async initialize () {
    await this.getResolvedInputs([
      '$OUTDIR/$JOB.log-ParsedLaTeXLog',
      '$DIR_0/$NAME_0.blg-ParsedBibTeXLog',
      '$DIR_0/$NAME_0.aux'
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
    return {
      args: ['bibtex', '$DIR_0/$NAME_0.aux'],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
    }
  }
}
