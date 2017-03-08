/* @flow */

import Rule from '../Rule'

import type { Command } from '../types'

export default class ParseOptionsFile extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static description: string = 'Parses the YAML option file.'

  async initialize () {
    await this.getResolvedInputs(['$HOME/.ouroboros.yaml', 'ouroboros.yaml', '$NAME.yaml'])
  }

  async preEvaluate () {
    if (this.inputs.size === 0) this.actions.delete('run')
  }

  async run () {
    for (const input of this.inputs.values()) {
      const output = await this.getResolvedOutput('$DIR/$BASE-ParsedYAML', input)
      if (output) {
        output.value = await input.safeLoad()
      }
    }

    return true
  }
}
