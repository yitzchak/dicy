/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeGlossaries extends Rule {
  static fileTypes: Set<string> = new Set(['GlossaryControlFile'])
  static description: string = 'Runs makeglossaries on any glossary files generated.'

  async initialize (): Promise<void> {
    await this.getResolvedInputs(['.acn', '.ist'])
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['.acr', '.alg', '.gls', '.glg'])
    return true
  }

  constructCommand () {
    const { dir, name } = path.parse(this.firstParameter.normalizedFilePath)
    const args = ['makeglossaries']

    if (dir) args.push('-d', dir)
    args.push(name)

    return args
  }
}
