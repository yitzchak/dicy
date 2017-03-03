/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class ApplyOptions extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Apply options from YAML file and any LaTeX magic comments found in source file.'

  async initialize () {
    await this.getResolvedInputs(['latex.yaml-ParsedYAML', '$name.yaml-ParsedYAML', '$base-ParsedLaTeXMagic'])
  }

  async run () {
    for (const file: File of this.inputs.values()) {
      if (file.value) {
        delete file.value.test
        Object.assign(this.state.options, file.value)
      }
    }
    return true
  }
}
