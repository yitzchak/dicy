/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class Asymptote extends Rule {
  static fileTypes: Set<string> = new Set(['Asymptote'])

  constructCommand () {
    return `asy -offscreen -vv "${path.basename(this.firstParameter.normalizedFilePath)}"`
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.options.outputDirectory
        ? path.resolve(this.rootPath, this.options.outputDirectory)
        : this.rootPath
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    const output = await this.getGeneratedOutput('.log-AsymptoteLog')
    if (output) output.value = `${stdout}\n${stderr}`
    return true
  }
}
