/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class GraphViz extends Rule {
  static fileTypes: Set<string> = new Set(['GraphViz'])
  static commands: Set<Command> = new Set(['build', 'graph'])
  static phases: Set<Phase> = new Set(['finalize'])
  static description: string = 'Runs GraphViz on dependency graphs.'

  constructCommand () {
    const { dir, name } = path.parse(this.firstParameter.normalizedFilePath)

    return [
      'fdp',
      `-T${this.options.outputFormat}`,
      '-o',
      path.format({ dir, name, ext: `.${this.options.outputFormat}` }),
      this.firstParameter.normalizedFilePath
    ]
  }
}
