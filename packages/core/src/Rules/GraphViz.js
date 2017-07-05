/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Command, CommandOptions } from '../types'

export default class GraphViz extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['GraphViz'])]
  static commands: Set<Command> = new Set(['graph'])
  static description: string = 'Runs GraphViz on dependency graphs.'

  constructCommand (): CommandOptions {
    return {
      args: [
        'fdp',
        `-T${this.options.outputFormat}`,
        '-o',
        '$DIR_0/$NAME_0.$OUTEXT',
        '$DIR_0/$BASE_0'
      ],
      cd: '$ROOTDIR',
      severity: 'error'
    }
  }
}
