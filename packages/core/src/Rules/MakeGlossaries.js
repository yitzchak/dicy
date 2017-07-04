/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeGlossaries extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['GlossaryControlFile'])]
  static description: string = 'Runs makeglossaries on any glossary files generated.'

  async initialize (): Promise<void> {
    await this.getResolvedInputs(['$DIR_0/$NAME_0.acn', '$DIR_0/$NAME_0.ist'])
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs([
      '$DIR_0/$NAME_0.acr',
      '$DIR_0/$NAME_0.alg',
      '$DIR_0/$NAME_0.gls',
      '$DIR_0/$NAME_0.glg'
    ])
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
