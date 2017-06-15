/* @flow */

import Rule from '../Rule'

import type { Command } from '../types'

const WRAPPED_LINE_PATTERN = /%$/

export default class ParseKnitrConcordance extends Rule {
  static fileTypes: Set<string> = new Set(['KnitrConcordance'])
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any knitr concordance files.'

  async run () {
    const outputFile = await this.getResolvedOutput('$DIR/$BASE-ParsedKnitrConcordance', this.firstParameter)
    if (!outputFile) return false

    const concordances: Array<Object> = []

    await this.firstParameter.parse([{
      names: ['output', 'input', 'indicies'],
      patterns: [/^\\Sconcordance\{concordance:([^:]*):([^:]*):([^}]*)\}$/],
      evaluate: (reference, groups) => {
        const encodedIndicies: Array<number> = groups.indicies.split(/\s+/).map(x => parseInt(x))
        const indicies: Array<[number, number]> = []
        let inputLine: number = 1
        let outputLine: number = 1

        for (let i = 1; i < encodedIndicies.length; i += 2) {
          for (let j = 0; j < encodedIndicies[i]; j++, outputLine++, inputLine += encodedIndicies[i + 1]) {
            indicies.push([inputLine, inputLine + encodedIndicies[i + 1]])
          }
        }

        concordances.push({
          input: groups.input,
          output: groups.output,
          indicies
        })
      }
    }], line => WRAPPED_LINE_PATTERN.test(line))

    outputFile.value = { concordances }

    return true
  }
}
