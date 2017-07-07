/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

function escapePath (filePath) {
  return filePath.replace(/\\/g, '\\\\')
}

export default class Knitr extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['Knitr'])]
  static description: string = 'Runs knitr on Rnw files.'

  constructCommand (): CommandOptions {
    const filePath = escapePath(this.firstParameter.filePath)
    const lines = ['library(knitr)']

    if (this.options.synctex) lines.push('opts_knit$set(concordance=TRUE)')
    lines.push(`knit('${filePath}')`)

    return {
      args: ['Rscript', '-e', lines.join(';')],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [
        '$DIR_0/$NAME_0.tex',
        '$DIR_0/$NAME_0-concordance.tex'
      ]
    }
  }
}
