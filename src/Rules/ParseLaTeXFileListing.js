/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class ParseLaTeXFileListing extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeXFileListing'])
  static priority: number = 200

  async evaluate () {
    let rootPath: string = ''
    const results = {
      INPUT: new Set(),
      OUTPUT: new Set()
    }

    await this.firstParameter.parse([{
      names: ['path'],
      patterns: [/^PWD (.*)$/],
      evaluate: (reference, groups) => {
        rootPath = groups.path
      }
    }, {
      names: ['type', 'path'],
      patterns: [/^(INPUT|OUTPUT) (.*)$/],
      evaluate: (reference, groups) => {
        results[groups.type].add(this.normalizePath(path.resolve(rootPath, groups.path)))
      }
    }])

    this.firstParameter.contents = {
      inputs: Array.from(results.INPUT),
      outputs: Array.from(results.OUTPUT)
    }
  }
}