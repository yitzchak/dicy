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
    const outputs = ['$DIR_0/$NAME_0.tex']

    // If concordance option is enabled the add the option
    if (this.options.Knitr_concordance) {
      lines.push('opts_knit$set(concordance=TRUE)')
      outputs.push('$DIR_0/$NAME_0-concordance.tex')
    }

    lines.push(`knit('${filePath}')`)

    return {
      args: ['Rscript', '-e', lines.join(';')],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs
    }
  }
}
