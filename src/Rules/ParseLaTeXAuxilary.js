/* @flow */

import Rule from '../Rule'

export default class ParseLaTeXAuxilary extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeXAuxilary'])
  static description: string = 'Parses the aux files produced by all variants of latex.'

  async initialize () {
    await this.getResolvedOutput(':dir/:base-ParseLaTeXAuxilary', this.firstParameter)
  }

  async run () {
    const parsedFile = await this.getResolvedOutput(':dir/:base-ParseLaTeXAuxilary', this.firstParameter)
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
