/* @flow */

import _ from 'lodash'

import Rule from '../Rule'

import type { Command, SourceMap, LineRange, LineRangeMapping } from '../types'

function inRange (range: LineRange, line: number) {
  return range.start <= line && range.end >= line
}

export default class ApplySourceMaps extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set(['ParsedSourceMap']),
    new Set([
      'ParsedAsymptoteLog',
      'ParsedBiberLog',
      'ParsedBibTeXLog',
      'ParsedLaTeXLog',
      'ParsedMakeIndexLog'
    ])
  ]
  static commands: Set<Command> = new Set(['build', 'log'])
  static description: string = 'Applies source maps to log files.'

  async initialize () {
    await this.getOutput(this.secondParameter.filePath)
  }

  async run () {
    const { sourceMaps } = this.firstParameter.value || {}
    let { messages } = this.secondParameter.value || {}

    messages = _.cloneDeep(messages)

    if (sourceMaps && messages) {
      for (const sourceMap: SourceMap of sourceMaps) {
        for (const message of messages) {
          if (!message.source || message.source.file !== sourceMap.output) continue

          if (message.source.range) {
            const startMapping: ?LineRangeMapping = sourceMap.mappings.find(mapping => inRange(mapping.output, message.source.range.start))
            const endMapping: ?LineRangeMapping = sourceMap.mappings.find(mapping => inRange(mapping.output, message.source.range.end))
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
    }

    this.secondParameter.value = { messages }

    return true
  }
}
