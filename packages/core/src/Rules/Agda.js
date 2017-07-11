/* @flow */

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type { CommandOptions, Command, Phase } from '../types'

export default class Agda extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LiterateAgda'])]
  static description: string = 'Runs agda on lagda files.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return await super.appliesToFile(state, command, phase, jobName, file) &&
      state.getOption('agdaProcessor', jobName) === 'agda'
  }

  constructCommand (): CommandOptions {
    return {
      args: ['agda', '--latex', '--latex-dir=.', '$BASE_0'],
      cd: '$ROOTDIR/$DIR_0',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.tex', '$DIR_0/$NAME_0.agdai', '$DIR_0/agda.sty']
    }
  }
}