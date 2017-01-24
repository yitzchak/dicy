/* @flow */

import BuildState from '../BuildState'
import Rule from '../Rule'

export default class DviToSvg extends Rule {
  static fileTypes: Set<string> = new Set(['DVI'])

  static async analyzeCheck (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'svg'
  }

  constructCommand () {
    return `dvisvgm -o "${this.resolveOutputPath('.svg')}" "${this.firstParameter.normalizedFilePath}"`
  }

  async postEvaluate () {
    await this.addResolvedOutputs('.svg')
  }
}
