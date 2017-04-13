/* @flow */

import State from '../State'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class PsToPdf extends Rule {
  static fileTypes: Set<string> = new Set(['PostScript'])
  static description: string = 'Converts PS to PDF using ps2pdf.'

  static async appliesToFile (state: State, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    const appliesToFile = super.appliesToFile(state, command, phase, jobName, file)
    return state.options.outputFormat === 'pdf' && appliesToFile
  }

  constructCommand () {
    return [
      'ps2pdf',
      this.firstParameter.filePath,
      this.resolvePath('$DIR/$NAME.pdf', this.firstParameter)
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$DIR/$NAME.pdf', this.firstParameter)
    return true
  }
}
