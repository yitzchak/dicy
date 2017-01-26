/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

export default class DviToSvg extends Rule {
  static fileTypes: Set<string> = new Set(['DVI'])

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'svg' &&
      await super.appliesToFile(buildState, jobName, file)
  }

  constructCommand () {
    return `dvisvgm -o "${this.resolveOutputPath('.svg')}" "${this.firstParameter.normalizedFilePath}"`
  }

  async postEvaluate (): Promise<boolean> {
    await this.getResolvedOutputs('.svg')
    return true
  }
}
