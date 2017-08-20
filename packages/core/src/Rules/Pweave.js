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
    const args = [
      'pweave',
      '--format', this.options.pweaveOutputFormat,
      '--output', outputPath
    ]
    let figureFormat = this.options.pweaveFigureFormat

    if (cacheDirectory !== 'cache') {
      args.push('--cache-directory', cacheDirectory)
    }

    if (figureDirectory !== 'figures') {
      args.push('--figure-directory', figureDirectory)
    }

    if (this.options.pweaveDocumentationMode) {
      args.push('--documentation-mode')
    }

    if (figureFormat === 'auto') {
      figureFormat = (this.options.outputFormat === 'pdf' && PDF_CAPABLE_LATEX_PATTERN.test(this.options.engine))
        ? 'pdf'
        : 'eps'
    }

    if (figureFormat !== 'pdf') {
      args.push('--figure-format', figureFormat)
    }

    args.push('$DIR_0/$BASE_0')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [outputPath]
    }
  }
}
