/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

export default class PdfToPs extends Rule {
  static fileTypes: Set<string> = new Set(['PortableDocumentFormat'])
  static description: string = 'Converts PDF to PS using pdf2ps. Enabled by the `pdfProducer` option.'

  static async appliesToFile (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps' &&
      await super.appliesToFile(buildState, jobName, file)
  }

  constructCommand () {
    return [
      'pdf2ps',
      this.firstParameter.normalizedFilePath,
      this.resolvePath('.ps')
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['.ps'])
    return true
  }
}
