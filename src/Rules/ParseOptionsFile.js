/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import Rule from '../Rule'

import type { Command } from '../types'

export default class ParseOptionsFile extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static description: string = 'Parses the YAML option file.'

  async initialize () {
    await this.getResolvedInputs(['latex.yaml', ':name.yaml'])
  }

  async preEvaluate () {
    if (this.inputs.size === 0) this.actions.delete('run')
  }

  async run () {
    for (const input of this.inputs.values()) {
      const output = await this.getResolvedOutput(':dir/:base-ParsedYAML', input)
      if (output) {
        // $FlowIgnore
        const contents = await fs.readFile(input.realFilePath, { encoding: 'utf-8' })
        output.value = yaml.safeLoad(contents)
      }
    }

    return true
  }
}
