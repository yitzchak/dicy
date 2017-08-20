/* @flow */

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type { CommandOptions, Command, Phase } from '../types'

export default class Agda extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LiterateAgda'])]
  static description: string = 'Runs agda on lagda files.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    return state.getOption('literateAgdaEngine', jobName) === 'agda'
  }

  constructCommand (): CommandOptions {
    return {
      args: ['agda', '--latex', '--latex-dir=.', '{{$BASE_0}}'],
      cd: '$ROOTDIR/$DIR_0',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.tex', '$DIR_0/$NAME_0.agdai', '$DIR_0/agda.sty']
    }
  }
}
