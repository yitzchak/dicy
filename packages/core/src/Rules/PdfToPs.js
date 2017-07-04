/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class PdfToPs extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['PortableDocumentFormat'])]
  static description: string = 'Converts PDF to PS using pdf2ps. Enabled by the `pdfProducer` option.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    const appliesToFile = await super.appliesToFile(state, command, phase, jobName, file)
    return state.options.outputFormat === 'ps' && appliesToFile
  }

  constructCommand () {
    return {
      args: [
        'pdf2ps',
        this.resolvePath('$DIR_0/$BASE_0'),
        this.resolvePath('$DIR_0/$NAME_0.ps')
      ],
      severity: 'error'
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$DIR_0/$NAME_0.ps')
    return true
  }
}
