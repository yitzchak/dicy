/* @flow */

import Rule from '../Rule'

import type { Command, Message } from '../types'

export default class ParseKnitrConcordance extends Rule {
  static fileTypes: Set<string> = new Set(['KnitrConcordance'])
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any knitr concordance files.'

  async run () {
    const outputFile = await this.getResolvedOutput('$DIR/$BASE-ParsedKnitrConcordance', this.firstParameter)
    if (!outputFile) return false

    let input: ?string
    let output: ?string
    let indicies: Array<number> = []

    this.firstParameter.parse([{
      names: ['output', 'input'],
      patterns: [/^\\Sconcordance\{concordance:([^:]*):([^:]*):%$/],
      evaluate: (reference, groups) => {
        input = groups.input
        output = groups.output
      }
    }, {
      names: ['indicies'],
      patterns: [/^([ 0-9]*)[%}]$/],
      evaluate: (reference, groups) => {
        indicies = indicies.concat(groups.indicies.split(/\s+/).map(x => parseInt(x)))
      }
    }])

    outputFile.value = { input, output, indicies }

    return true
  }
}
