/* @flow */

import Rule from '../Rule'

import type { Command, CommandOptions } from '../types'

export default class GraphViz extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['GraphViz'])]
  static commands: Set<Command> = new Set(['graph'])
  static description: string = 'Runs GraphViz on dependency graphs.'

  constructCommand (): CommandOptions {
    // Right now we only call fdp. Long usefulness of this is unknown.
    return {
      args: [
        'fdp',
        `-T${this.options.outputFormat}`,
        '-o',
        '{{$DIR_0/$NAME_0.$OUTEXT}}',
        '{{$FILEPATH_0}}'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.$OUTEXT']
    }
  }
}
