/* @flow */

import path from 'path'
import Rule from '../Rule'

function escapePath (filePath) {
  return filePath.replace(/\\/g, '\\\\')
}

export default class Knitr extends Rule {
  static fileTypes: Set<string> = new Set(['Knitr'])

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    const { dir, name } = path.parse(this.firstParameter.normalizedFilePath)
    await this.getOutputs([
      path.format({ dir, name, ext: '.tex' }),
      path.format({ dir, name, ext: '-concordance.tex' })
    ])
    return true
  }

  constructCommand () {
    const args = [
      '-e "library(knitr)"',
      '-e "opts_knit$set(concordance=TRUE)"',
      `-e "knit('${escapePath(this.firstParameter.normalizedFilePath)}')"`
    ]

    return `Rscript ${args.join(' ')}`
  }
}
