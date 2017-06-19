/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeGlossaries extends Rule {
  static fileTypes: Array<Set<string>> = [new Set(['GlossaryControlFile'])]
  static description: string = 'Runs makeglossaries on any glossary files generated.'

  async initialize (): Promise<void> {
    await this.getResolvedInputs(['$DIR/$NAME.acn', '$DIR/$NAME.ist'], this.firstParameter)
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['$DIR/$NAME.acr', '$DIR/$NAME.alg', '$DIR/$NAME.gls', '$DIR/$NAME.glg'], this.firstParameter)
    return true
  }

  constructCommand () {
    const { dir, name } = path.parse(this.firstParameter.filePath)
    const args = ['makeglossaries']

    if (dir) args.push('-d', dir)
    args.push(name)

    return {
      args,
      severity: 'error'
    }
  }
}
