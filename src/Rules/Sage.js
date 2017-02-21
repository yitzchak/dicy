/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class Sage extends Rule {
  static fileTypes: Set<string> = new Set(['Sage'])
  static description: string = 'Supports SageTeX by running Sage when needed.'

  constructCommand () {
    return ['sage', path.basename(this.firstParameter.normalizedFilePath)]
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.options.outputDirectory
        ? path.resolve(this.rootPath, this.options.outputDirectory)
        : this.rootPath
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs([':dir/:name.sout', ':dir/:name.sage.cmd', ':dir/:name.scmd', ':dir/:base.py'], this.firstParameter)
    await this.getGlobbedOutputs(':dir/sage-plots-for-:name.tex/*', this.firstParameter)
    return true
  }
}
