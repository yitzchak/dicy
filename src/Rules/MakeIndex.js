/* @flow */

import Rule from '../Rule'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile'])

  async initialize () {
    await this.addResolvedInputs('.ilg-ParsedMakeIndexLog')
  }

  async postEvaluate (stdout: string, stderr: string): Promise<boolean> {
    await this.addResolvedOutputs('.ind', '.ilg')
    return true
  }

  constructCommand () {
    return `makeindex "${this.firstParameter.normalizedFilePath}"`
  }
}
