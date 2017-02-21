/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MetaPost extends Rule {
  static fileTypes: Set<string> = new Set(['MetaPost'])
  static description: string = 'Runs MetaPost on produced MetaPost files.'

  constructCommand () {
    return ['mpost', path.basename(this.firstParameter.normalizedFilePath)]
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.options.outputDirectory
        ? path.resolve(this.rootPath, this.options.outputDirectory)
        : this.rootPath
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs([':dir/:name.1', ':dir/:name.log', ':dir/:name.t1'], this.firstParameter)
    return true
  }
}
