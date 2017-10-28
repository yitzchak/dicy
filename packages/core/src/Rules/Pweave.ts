import Rule from '../Rule'

import { CommandOptions } from '../types'

export default class Pweave extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['PythonNoWeb'])]
  static description: string = 'Runs Pweave on Pnw files.'

  constructCommand (): CommandOptions {
    const cacheDirectory = this.options.pweaveCacheDirectory
    const figureDirectory = this.options.pweaveFigureDirectory
    const kernel = this.options.pweaveKernel
    const outputPath = this.options.pweaveOutputPath
    // Always add output format and output path.
    const args = [
      'pweave',
      `--format=${this.options.pweaveOutputFormat}`,
      `--output={{${outputPath}}}`
    ]

    // If the cache directory is not the default then set it.
    if (cacheDirectory !== 'cache') {
      args.push(`--cache-directory={{${cacheDirectory}}}`)
    }

    // If the figure directory is not the default then set it.
    if (figureDirectory !== 'figures') {
      args.push(`--figure-directory={{${figureDirectory}}}`)
    }

    if (kernel !== 'python3') {
      args.push(`--kernel=${kernel}`)
    }

    // Add the documentation mode option if it is set.
    if (this.options.pweaveDocumentationMode) {
      args.push('--documentation-mode')
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
