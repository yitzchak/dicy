/* @flow */

import Rule from '../Rule'

import type { Command, LineRangeMapping, SourceMap } from '../types'

const WRAPPED_LINE_PATTERN = /%$/

export default class ParseKnitrConcordance extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['KnitrConcordance'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Parses any knitr concordance files.'

  async run () {
    const outputFile = await this.getResolvedOutput('$DIR/$BASE-ParsedSourceMap', this.firstParameter)
    if (!outputFile) return false

    const sourceMaps: Array<SourceMap> = []

    await this.firstParameter.parse([{
      names: ['output', 'input', 'indicies'],
      patterns: [/^\\Sconcordance\{concordance:([^:]*):([^:]*):([^}]*)\}$/],
      evaluate: (references, groups) => {
        const encodedIndicies: Array<number> = groups.indicies.split(/\s+/).map(x => parseInt(x))
        const mappings: Array<LineRangeMapping> = []
        let inputLine: number = 1
        let outputLine: number = 1

        for (let i = 1; i < encodedIndicies.length; i += 2) {
          for (let j = 0; j < encodedIndicies[i]; j++, outputLine++, inputLine += encodedIndicies[i + 1]) {
            mappings.push({
              input: { start: inputLine, end: inputLine + encodedIndicies[i + 1] },
              output: { start: outputLine, end: outputLine }
            })
          }
        }

        sourceMaps.push({
          input: groups.input,
          output: groups.output,
          mappings
        })
      }
    }], line => WRAPPED_LINE_PATTERN.test(line))

    outputFile.value = { sourceMaps }

    return true
  }
}
