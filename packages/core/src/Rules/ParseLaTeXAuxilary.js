/* @flow */

import Rule from '../Rule'

export default class ParseLaTeXAuxilary extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['LaTeXAuxilary'])]
  static description: string = 'Parses the aux files produced by all variants of latex.'

  async run () {
    const output = await this.getResolvedOutput('$DIR_0/$BASE_0-ParsedLaTeXAuxilary')
    if (!output) return false

    const results = {}

    await this.firstParameter.parse([{
      names: ['bibdata'],
      patterns: [/\\bibdata\{([^}]+)\}$/],
      evaluate: (reference, groups) => {
        results.bibdata = groups.bibdata.split(',')
      }
    }])

    output.value = results

    return true
  }
}
