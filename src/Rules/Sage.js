/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class Sage extends Rule {
  static fileTypes: Set<string> = new Set(['Sage'])
  static description: string = 'Supports SageTeX by rulling Sage when needed.'

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
    const { dir, name } = path.parse(this.firstParameter.normalizedFilePath)
    for (const ext of ['.sout', '.sage.cmd', 'scmd']) {
      await this.getOutput(path.format({ dir, name, ext }))
    }
    return true
  }
}
