/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, CommandOptions, Phase } from '../types'

export default class DviToSvg extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['DeviceIndependentFile'])]
  static description: string = 'Converts DVI to SVG using dvisvgm.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    return state.getOption('outputFormat', jobName) === 'svg'
  }

  async initialize () {
    await this.replaceResolvedTarget('$DIR_0/$BASE_0', '$DIR_0/$NAME_0.svg')
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'dvisvgm',
        '-o',
        '$DIR_0/$NAME_0.svg',
        '$DIR_0/$BASE_0'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.svg']
    }
  }
}
