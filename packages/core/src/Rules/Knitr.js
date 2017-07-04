/* @flow */

import Rule from '../Rule'

function escapePath (filePath) {
  return filePath.replace(/\\/g, '\\\\')
}

export default class Knitr extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['Knitr'])]
  static description: string = 'Runs knitr on Rnw files.'

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs([
      '$DIR_0/$NAME_0.tex',
      '$DIR_0/$NAME_0-concordance.tex'
    ])
    return true
  }

  constructCommand () {
    const filePath = escapePath(this.firstParameter.filePath)
    const lines = ['library(knitr)']

    if (this.options.synctex) lines.push('opts_knit$set(concordance=TRUE)')
    lines.push(`knit('${filePath}')`)

    return {
      args: ['Rscript', '-e', lines.join(';')],
      severity: 'error'
    }
  }
}
