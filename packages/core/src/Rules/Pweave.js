/* @flow */

import Rule from '../Rule'

import type { CommandOptions } from '../types'

const PDF_CAPABLE_LATEX_PATTERN = /^(pdf|xe|lua)latex$/

export default class Pweave extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['PythonNoWeb'])]
  static description: string = 'Runs Pweave on Pnw files.'

  constructCommand (): CommandOptions {
    const cacheDirectory = this.options.pweaveCacheDirectory
    const figureDirectory = this.options.pweaveFigureDirectory
    const outputPath = this.options.pweaveOutputPath
    // Always add output format and output path.
    const args = [
      'pweave',
      `--format=${this.options.pweaveOutputFormat}`,
      `--output={{${outputPath}}}`
    ]
    let figureFormat = this.options.pweaveFigureFormat

    // If the cache directory is not the default then set it.
    if (cacheDirectory !== 'cache') {
      args.push(`--cache-directory={{${cacheDirectory}}}`)
    }

    // If the figure directory is not the default then set it.
    if (figureDirectory !== 'figures') {
      args.push(`--figure-directory={{${figureDirectory}}}`)
    }

    // Add the documentation mode option if it is set.
    if (this.options.pweaveDocumentationMode) {
      args.push('--documentation-mode')
    }

    // If the output format is pdf the set the output format to pdf unless
    // the current LaTeX engine cannot produce pdf files. In that case use eps
    // files.
    if (figureFormat === 'auto') {
      figureFormat = (this.options.outputFormat === 'pdf' && PDF_CAPABLE_LATEX_PATTERN.test(this.options.engine))
        ? 'pdf'
        : 'eps'
    }

    // Only set the option if it is not pdf
    if (figureFormat !== 'pdf') {
      args.push(`--figure-format=${figureFormat}`)
    }

    args.push('{{$FILEPATH_0}}')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [outputPath]
    }
  }
}
