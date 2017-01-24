/* @flow */

import BuildState from '../BuildState'
import Rule from '../Rule'

export default class DviToPdf extends Rule {
  static fileTypes: Set<string> = new Set(['PDF'])

  static async analyzeCheck (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps'
  }

  constructCommand () {
    return `pdf2ps "${this.firstParameter.normalizedFilePath}" "${this.resolveOutputPath('.ps')}"`
  }

  async postEvaluate () {
    await this.addResolvedOutputs('.ps')
  }
}
