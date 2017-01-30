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
    return `dvisvgm -o "${this.resolveGeneratedPath('.svg')}" "${this.firstParameter.normalizedFilePath}"`
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getGeneratedOutputs('.svg')
    return true
  }
}
