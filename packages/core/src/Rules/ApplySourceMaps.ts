import * as _ from 'lodash'

import Rule from '../Rule'

import { Command, SourceMap, LineRange, LineRangeMapping, ParsedLog, SourceMaps } from '../types'

function inRange (range: LineRange, line: number) {
  return range.start <= line && range.end >= line
}

export default class ApplySourceMaps extends Rule {
  static parameterTypes: Set<string>[] = [
    new Set<string>(['ParsedSourceMap']),
    new Set<string>([
      'ParsedAsymptoteLog',
      'ParsedBiberLog',
      'ParsedBibTeXLog',
      'ParsedLaTeXLog',
      'ParsedMakeIndexLog'
    ])
  ]
  static commands: Set<Command> = new Set<Command>(['build', 'log'])
  static description: string = 'Applies source maps to log files.'

  async initialize () {
    // We are going to modify the log so add it as an output
    await this.getOutput(this.secondParameter.filePath)
  }

  async run () {
    if (!this.secondParameter.value || !this.firstParameter.value) return true

    const sourceMaps: SourceMaps = this.firstParameter.value
    const parsedLog: ParsedLog = _.cloneDeep(this.secondParameter.value)

    for (const sourceMap of sourceMaps.maps) {
      for (const message of parsedLog.messages) {
        if (!message.source || message.source.file !== sourceMap.output) continue

        if (message.source && message.source.range) {
          const startMapping: LineRangeMapping | undefined = sourceMap.mappings.find(mapping => !!message.source && !!message.source.range && inRange(mapping.output, message.source.range.start))
          const endMapping: LineRangeMapping | undefined = sourceMap.mappings.find(mapping => !!message.source && !!message.source.range && inRange(mapping.output, message.source.range.end))
          if (startMapping && endMapping) {
            message.source = {
              file: sourceMap.input,
              range: {
                start: startMapping.input.start,
                end: endMapping.input.end
              }
            }
          }
        } else {
          message.source = { file: sourceMap.input }
        }
      }
    }

    this.secondParameter.value = parsedLog

    return true
  }
}
