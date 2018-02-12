import { Reference } from '@dicy/types'

import Rule from '../Rule'
import {
  Action, LineRangeMapping, ParserMatch, RuleDescription, SourceMaps
} from '../types'

const WRAPPED_LINE_PATTERN = /%$/

export default class ParseKnitrConcordance extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build', 'log'],
    phases: ['execute'],
    parameters: [['KnitrConcordance']]
  }]
  static defaultActions: Action[] = ['parse']

  async parse () {
    const outputFile = await this.getResolvedOutput('$FILEPATH_0-ParsedSourceMap')
    if (!outputFile) return false

    const sourceMaps: SourceMaps = {
      maps: []
    }

    await this.firstParameter.parse([{
      names: ['output', 'input', 'indicies'],
      patterns: [/^\\Sconcordance\{concordance:([^:]*):([^:]*):([^}]*)\}$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        // Split up the indicies in preparation to decode the RLE array.
        const encodedIndicies: number[] = match.groups.indicies.split(/\s+/).map(x => parseInt(x, 10))
        const mappings: LineRangeMapping[] = []
        let inputLine: number = 1
        let outputLine: number = 1

        // Decode the RLE into input/output ranges
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

        sourceMaps.maps.push({
          input: match.groups.input,
          output: match.groups.output,
          mappings
        })
      }
    }], line => WRAPPED_LINE_PATTERN.test(line))

    outputFile.value = sourceMaps

    return true
  }
}
