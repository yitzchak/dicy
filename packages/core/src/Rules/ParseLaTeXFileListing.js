/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class ParseLaTeXFileListing extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LaTeXFileListing'])]
  static description: string = 'Parse the file listing (fls) file generated by latex. Used to update the dependencies for rule LaTeX.'

  async run () {
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedLaTeXFileListing')
    if (!output) return false

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

    output.value = {
      inputs: Array.from(results.INPUT),
      outputs: Array.from(results.OUTPUT)
    }

    return true
  }
}
