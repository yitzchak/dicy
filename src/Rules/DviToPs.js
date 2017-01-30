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
    return `dvips -o "${this.resolveGeneratedPath('.ps')}" "${this.firstParameter.normalizedFilePath}"`
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getGeneratedOutputs('.ps')
    return true
  }
}
