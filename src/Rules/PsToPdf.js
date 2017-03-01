/* @flow */

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class PsToPdf extends Rule {
  static fileTypes: Set<string> = new Set(['PostScript'])
  static description: string = 'Converts PS to PDF using ps2pdf.'

  static async appliesToFile (buildState: BuildState, command: Command, phase: Phase, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'pdf' &&
      await super.appliesToFile(buildState, command, phase, jobName, file)
  }

  constructCommand () {
    return [
      'ps2pdf',
      this.firstParameter.filePath,
      this.resolvePath('$dir/$name.pdf', this.firstParameter)
    ]
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutput('$dir/$name.pdf', this.firstParameter)
    return true
  }
}
