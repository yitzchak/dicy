/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase, CommandOptions } from '../types'

export default class EpsToPdf extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['EncapsulatedPostScript'])]
  static description: string = 'Converts EPS to PDF using epstopdf.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    return false
    // Only apply if output format is pdf
    // return state.getOption('outputFormat', jobName) === 'pdf'
  }

  async initialize () {
    // Zap the previous target since we are building a pdf
    await this.replaceResolvedTarget('$DIR_0/$BASE_0', '$DIR_0/$NAME_0.pdf')
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'epstopdf',
        '$DIR_0/$BASE_0',
        '$DIR_0/$NAME_0.pdf'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.pdf']
    }
  }
}
