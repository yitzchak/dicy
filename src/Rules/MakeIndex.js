/* @flow */

import Rule from '../Rule'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile'])

  async initialize () {
    await this.addResolvedInputs(['.ilg-ParsedMakeIndexLog'])
  }

  async evaluate (): Promise<boolean> {
    return await this.execute()
  }

  async postExecute (stdout: string, stderr: string) {
    await this.addResolvedOutputs(['.ind', '.ilg'])
  }

  constructCommand () {
    return `makeindex "${this.firstParameter.normalizedFilePath}"`
  }
}
