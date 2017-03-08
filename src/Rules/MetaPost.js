/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MetaPost extends Rule {
  static fileTypes: Set<string> = new Set(['MetaPost'])
  static description: string = 'Runs MetaPost on produced MetaPost files.'

  constructCommand () {
    return ['mpost', path.basename(this.firstParameter.filePath)]
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.options.outputDirectory
        ? path.resolve(this.rootPath, this.options.outputDirectory)
        : this.rootPath
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['$DIR/$NAME.1', '$DIR/$NAME.log', '$DIR/$NAME.t1'], this.firstParameter)
    return true
  }
}
