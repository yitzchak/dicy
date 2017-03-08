/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class PdfToPs extends Rule {
  static fileTypes: Set<string> = new Set(['PortableDocumentFormat'])
  static description: string = 'Converts PDF to PS using pdf2ps. Enabled by the `pdfProducer` option.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return state.options.outputFormat === 'ps' &&
      await super.appliesToFile(state, command, phase, jobName, file)
  }

  constructCommand () {
    return [
      'pdf2ps',
      this.firstParameter.filePath,
      this.resolvePath('$DIR/$NAME.ps', this.firstParameter)
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$DIR/$NAME.ps', this.firstParameter)
    return true
  }
}
