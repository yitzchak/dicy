/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class ParseLaTeXFileListing extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeXFileListing'])

  async evaluate () {
    const parsedFile = await this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedLaTeXFileListing`)
    if (!parsedFile) return false
    this.actionTrace()
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

    parsedFile.value = {
      inputs: Array.from(results.INPUT),
      outputs: Array.from(results.OUTPUT)
    }

    return true
  }
}
