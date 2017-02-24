/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class PdfToPs extends Rule {
  static fileTypes: Set<string> = new Set(['PortableDocumentFormat'])
  static description: string = 'Converts PDF to PS using pdf2ps. Enabled by the `pdfProducer` option.'

  static async appliesToFile (buildState: BuildState, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'ps' &&
      await super.appliesToFile(buildState, command, phase, jobName, file)
  }

  constructCommand () {
    return [
      'pdf2ps',
      this.firstParameter.filePath,
      this.resolvePath(':dir/:name.ps', this.firstParameter)
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput(':dir/:name.ps', this.firstParameter)
    return true
  }
}
