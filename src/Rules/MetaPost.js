/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MetaPost extends Rule {
  static fileTypes: Set<string> = new Set(['MetaPost'])
  static description: string = 'Runs metapost on produced mp files.'

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
    await this.getRelatedOutput('.1')
    return true
  }
}
