/* @flow */

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type {
  Action,
  Command,
  CommandOptions,
  OptionsInterface,
  Phase
} from '../types'

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
    const args = ['bib2gls', '-t', '{{$NAME_0.gelg}}']

    // Only push the -d option if needed.
    if (this.env.DIR_0 !== '.') args.push('-d', '{{$DIR_0}}')
    args.push('{{$NAME_0}}')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: ['$DIR_0/$NAME_0.gelg-ParsedBibToGlsLog'],
      outputs: ['$DIR_0/$NAME_0.gelg']
    }
  }
}
