/* @flow */

import Rule from '../Rule'

export default class LhsToTeX extends Rule {
  static fileTypes: Set<string> = new Set(['LiterateHaskell'])
  static description: string = 'Runs lhs2TeX on lhs files.'

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('.tex', {
      referenceFile: this.firstParameter,
      useJobName: false,
      useOutputDirectory: false
    })
    return true
  }

  constructCommand () {
    const outputPath = this.expandPath(':dir/:name.tex', this.firstParameter)
    return ['lhs2TeX', '-o', outputPath, this.firstParameter.normalizedFilePath]
  }
}
