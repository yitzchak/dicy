/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

export default class DviToPs extends Rule {
  static fileTypes: Set<string> = new Set(['DeviceIndependentFile'])
  static description: string = 'Converts DVI to PS using dvips.'

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps' &&
      await super.appliesToFile(buildState, jobName, file)
  }

  constructCommand () {
    return [
      'dvips',
      '-o',
      this.resolvePath('.ps'),
      this.firstParameter.normalizedFilePath
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['.ps'])
    return true
  }
}
