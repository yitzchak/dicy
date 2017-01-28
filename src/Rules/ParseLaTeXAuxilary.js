/* @flow */

import Rule from '../Rule'

export default class ParseLaTeXAuxilary extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeXAuxilary'])

  async run () {
    const parsedFile = await this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedLaTeXAuxilary`)
    if (!parsedFile) return false
    const results = {}

    await this.firstParameter.parse([{
      names: ['bibdata'],
      patterns: [/\\bibdata\{([^}]+)\}$/],
      evaluate: (reference, groups) => {
        results.bibdata = groups.bibdata.split(',')
      }
    }])

    parsedFile.value = results

    return true
  }
}
