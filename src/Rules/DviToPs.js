/* @flow */

import BuildState from '../BuildState'
import Rule from '../Rule'

export default class DviToPs extends Rule {
  static fileTypes: Set<string> = new Set(['DVI'])

  static async analyzeCheck (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps'
  }

  constructCommand () {
    return `dvips -o "${this.resolveOutputPath('.ps')}" "${this.firstParameter.normalizedFilePath}"`
  }

  async postEvaluate () {
    await this.addResolvedOutputs('.ps')
  }
}
