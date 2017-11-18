import Rule from '../Rule'
import { CommandOptions } from '../types'

function escapePath (filePath: string): string {
  return filePath.replace(/\\/g, '\\\\')
}

export default class Knitr extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['RNoWeb'])]
  static description: string = 'Runs knitr on Rnw files.'

  constructCommand (): CommandOptions {
    const escapedFilePath = escapePath(this.firstParameter.filePath)
    const outputPath = this.options.knitrOutputPath
    const escapedDutputPath = escapePath(this.resolvePath(outputPath))
    const lines = ['library(knitr)']
    const outputs = [outputPath]

    // If concordance option is enabled the add the option
    if (this.options.knitrConcordance) {
      lines.push('opts_knit$set(concordance=TRUE)')
      outputs.push(outputPath.replace(/\.[^.]*$/, '-concordance.tex'))
    }

    lines.push(`knit('${escapedFilePath}','${escapedDutputPath}')`)

    return {
      args: ['Rscript', '-e', lines.join(';')],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs
    }
  }
}
