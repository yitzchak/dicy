import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Action, CommandOptions, Phase } from '../types'

export default class BibToGls extends Rule {
  static parameterTypes: Set<string>[] = [
    new Set(['LaTeXAuxilary']),
    new Set(['ParsedLaTeXAuxilary'])
  ]
  static description: string = 'Runs bib2gls to process bibliography files (bib) when need is detected.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return consumer.isGrandparentOf(parameters[0], parameters[1]) &&
      !!parameters[1].value && !!parameters[1].value.commands &&
      !!parameters[1].value.commands.includes('glsxtr@resource')
  }

  async getFileActions (file: File): Promise<Action[]> {
    switch (file.type) {
      case 'ParsedBibToGlsLog':
        return ['updateDependencies']
      case 'LaTeXAuxilary':
        return ['run']
    }

    return []
  }

  constructCommand (): CommandOptions {
    const command = ['bib2gls', '-t', '{{$NAME_0.gelg}}']

    // Only push the -d option if needed.
    if (this.env.DIR_0 !== '.') command.push('-d', '{{$DIR_0}}')
    command.push('{{$NAME_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: [{ file: '$DIR_0/$NAME_0.gelg-ParsedBibToGlsLog' }],
      outputs: [{ file: '$DIR_0/$NAME_0.gelg' }]
    }
  }
}
