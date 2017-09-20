/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, OptionsInterface, Phase } from '../types'

export default class BibToGls extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set(['LaTeXAuxilary']),
    new Set(['ParsedLaTeXAuxilary'])
  ]
  static description: string = 'Runs bib2gls to process bibliography files (bib) when need is detected.'

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: Array<File> = []): Promise<boolean> {
    return state.isGrandparentOf(parameters[0], parameters[1]) &&
      !!parameters[1].value && !!parameters[1].value.commands.includes('glsxtr@resource')
  }

  async initialize () {
    await this.getResolvedInputs([
      '$DIR_0/$NAME_0.glg-ParsedBibToGlsLog',
      '$FILEPATH_0'
    ])
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    switch (file.type) {
      case 'ParsedBibToGlsLog':
        return ['updateDependencies']
      case 'LaTeXAuxilary':
        return ['run']
    }

    return []
  }

  constructCommand (): CommandOptions {
    const { dir, name } = path.parse(this.firstParameter.filePath)
    const args = ['bib2gls']

    // Only push the -d option if needed.
    if (dir) args.push('-d', dir)
    args.push(name)

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [
        '$DIR_0/$NAME_0.glg'
      ]
    }
  }
}
