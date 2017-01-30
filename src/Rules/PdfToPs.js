/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

export default class DviToPdf extends Rule {
  static fileTypes: Set<string> = new Set(['PDF'])

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps' &&
      await super.appliesToFile(buildState, jobName, file)
  }

  constructCommand () {
    return `pdf2ps "${this.firstParameter.normalizedFilePath}" "${this.resolveGeneratedPath('.ps')}"`
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getGeneratedOutputs('.ps')
    return true
  }
}
