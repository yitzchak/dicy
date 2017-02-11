/* @flow */

import Rule from '../Rule'

export default class LhsToTeX extends Rule {
  static fileTypes: Set<string> = new Set(['LiterateHaskell'])
  static description: string = 'Runs lhs2TeX on lhs files.'

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getRelatedOutput('.tex')
    return true
  }

  constructCommand () {
    return ['lhs2TeX', '-o', this.firstParameter.getRelatedPath('.tex'), this.firstParameter.normalizedFilePath]
  }
}
