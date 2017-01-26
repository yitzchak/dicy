/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MetaPost extends Rule {
  static fileTypes: Set<string> = new Set(['MetaPost'])

  constructCommand () {
    return `mpost "${path.basename(this.firstParameter.normalizedFilePath)}"`
  }

  constructProcessOptions (): Object {
    console.log(this.options.outputDirectory
            ? path.resolve(this.rootPath, this.options.outputDirectory)
            : this.rootPath)
    return {
      cwd: this.options.outputDirectory
        ? path.resolve(this.rootPath, this.options.outputDirectory)
        : this.rootPath
    }
  }

  async postEvaluate (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs('.1')
    return true
  }
}
