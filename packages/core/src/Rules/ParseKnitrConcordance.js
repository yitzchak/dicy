/* @flow */

import Rule from '../Rule'

import type { Action, Command, LineRangeMapping, SourceMap } from '../types'

const WRAPPED_LINE_PATTERN = /%$/

export default class ParseKnitrConcordance extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['KnitrConcordance'])]
  static commands: Set<Command> = new Set(['build', 'log'])
  static defaultActions: Array<Action> = ['parse']
  static description: string = 'Parses any knitr concordance files.'

  async parse () {
    const outputFile = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedSourceMap')
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
            const start = inputLine
            const end = inputLine + encodedIndicies[i + 1] - 1

            if (start <= end) {
              mappings.push({
                input: { start, end },
                output: { start: outputLine, end: outputLine }
              })
            }
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
