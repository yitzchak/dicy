/* @flow */

import BuildState from '../BuildState'
import Rule from '../Rule'

export default class DviPdf extends Rule {
  static fileTypes: Set<string> = new Set(['DVI'])

  static async analyzeCheck (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'pdf'
  }

  constructCommand () {
    return `xdvipdfmx -o "${this.resolveOutputPath('.pdf')}" "${this.firstParameter.normalizedFilePath}"`
  }
}
