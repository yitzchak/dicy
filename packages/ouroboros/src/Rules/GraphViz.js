/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Command } from '../types'

export default class GraphViz extends Rule {
  static fileTypes: Set<string> = new Set(['GraphViz'])
  static commands: Set<Command> = new Set(['graph'])
  static description: string = 'Runs GraphViz on dependency graphs.'

  constructCommand () {
    const { dir, name } = path.parse(this.firstParameter.filePath)

    return [
      'fdp',
      `-T${this.options.outputFormat}`,
      '-o',
      path.format({ dir, name, ext: `.${this.options.outputFormat}` }),
      this.firstParameter.filePath
    ]
  }
}
