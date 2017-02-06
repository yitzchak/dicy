/* @flow */

import Rule from '../Rule'

function escapePath (filePath) {
  return filePath.replace(/\\/g, '\\\\')
}

export default class Knitr extends Rule {
  static fileTypes: Set<string> = new Set(['Knitr'])
  static description: string = 'Runs knitr on Rnw files.'

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['.tex', '-concordance.tex'], { useJobName: false, useOutputDirectory: false })
    return true
  }

  constructCommand () {
    const filePath = escapePath(this.firstParameter.normalizedFilePath)
    const lines = ['library(knitr)']

    if (this.options.synctex) lines.push('opts_knit$set(concordance=TRUE)')
    lines.push(`knit('${filePath}')`)

    return ['Rscript', '-e', lines.join(';')]
  }
}
