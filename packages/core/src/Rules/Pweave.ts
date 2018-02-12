import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class Pweave extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['PythonNoWeb']]
  }]

  constructCommand (): CommandOptions {
    const cacheDirectory = this.options.pweaveCacheDirectory
    const figureDirectory = this.options.pweaveFigureDirectory
    const kernel = this.options.pweaveKernel
    const outputPath = this.options.pweaveOutputPath
    // Always add output format and output path.
    const command = [
      'pweave',
      `--format=${this.options.pweaveOutputFormat}`,
      `--output={{${outputPath}}}`
    ]

    // If the cache directory is not the default then set it.
    if (cacheDirectory !== 'cache') {
      command.push(`--cache-directory={{${cacheDirectory}}}`)
    }

    // If the figure directory is not the default then set it.
    if (figureDirectory !== 'figures') {
      command.push(`--figure-directory={{${figureDirectory}}}`)
    }

    if (kernel !== 'python3') {
      command.push(`--kernel=${kernel}`)
    }

    // Add the documentation mode option if it is set.
    if (this.options.pweaveDocumentationMode) {
      command.push('--documentation-mode')
    }

    command.push('{{$FILEPATH_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [{ file: outputPath }]
    }
  }
}
