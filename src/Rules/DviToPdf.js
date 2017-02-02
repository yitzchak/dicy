/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

export default class DviToPdf extends Rule {
  static fileTypes: Set<string> = new Set(['DeviceIndependentFile'])

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'pdf' &&
      await super.appliesToFile(buildState, jobName, file)
  }

  constructCommand () {
    return [
      'xdvipdfmx',
      '-o',
      this.resolvePath('.pdf'),
      this.firstParameter.normalizedFilePath
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['.pdf'])
    return true
  }
}
