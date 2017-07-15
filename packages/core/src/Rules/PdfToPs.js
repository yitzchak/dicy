/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase, CommandOptions } from '../types'

export default class PdfToPs extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['PortableDocumentFormat'])]
  static description: string = 'Converts PDF to PS using pdf2ps. Enabled by the `pdfProducer` option.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    const appliesToFile = await super.appliesToFile(state, command, phase, jobName, file)
    return state.getOption('outputFormat', jobName) === 'ps' && appliesToFile
  }

  async initialize () {
    await this.replaceResolvedTarget('$DIR_0/$BASE_0', '$DIR_0/$NAME_0.ps')
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'pdf2ps',
        '$DIR_0/$BASE_0',
        '$DIR_0/$NAME_0.ps'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: ['$DIR_0/$NAME_0.ps']
    }
  }
}
