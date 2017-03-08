/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class ApplyOptions extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Apply options from YAML file and any LaTeX magic comments found in source file.'

  async run () {
    const inputs = await this.getResolvedInputs([
      '$HOME/.ouroboros.yaml-ParsedYAML',
      'ouroboros.yaml-ParsedYAML',
      '$NAME.yaml-ParsedYAML',
      '$BASE-ParsedLaTeXMagic',
      'ouroboros-instance.yaml-ParsedYAML'])

    this.state.resetOptions()
    for (const file: File of inputs) {
      if (file.value) {
        this.state.assignOptions(file.value)
      }
    }

    return true
  }
}
