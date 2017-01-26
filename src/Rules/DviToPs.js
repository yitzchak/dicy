/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

export default class DviToPs extends Rule {
  static fileTypes: Set<string> = new Set(['DVI'])

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps' &&
      await super.appliesToFile(buildState, jobName, file)
  }

  constructCommand () {
    return `dvips -o "${this.resolveOutputPath('.ps')}" "${this.firstParameter.normalizedFilePath}"`
  }

  async postEvaluate (): Promise<boolean> {
    await this.getResolvedOutputs('.ps')
    return true
  }
}
