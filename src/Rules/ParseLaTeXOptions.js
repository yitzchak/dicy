/* @flow */

import yaml from 'js-yaml'

import Rule from '../Rule'

import type { Command } from '../types'

export default class ParseLaTeXMagic extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static fileTypes: Set<string> = new Set(['Knitr', 'LaTeX', 'LiterateHaskell'])
  static description: string = 'Parses YAML comments in LaTeX or knitr documents.'

  async run () {
    const output = await this.getResolvedOutput(':dir/:base-ParsedYAML', this.firstParameter)
    let contents = ''

    if (!output) return true

    await this.firstParameter.parse([{
      names: ['line'],
      patterns: [/^%%(.*)$/],
      evaluate: (reference, groups) => {
        contents += groups.line + '\n'
      }
    }])

    output.value = yaml.safeLoad(contents)

    return true
  }
}
