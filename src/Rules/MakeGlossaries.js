/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeGlossaries extends Rule {
  static fileTypes: Set<string> = new Set(['GlossaryControlFile'])
  static description: string = 'Runs makeglossaries on any glossary files generated.'

  async initialize (): Promise<void> {
    await this.getResolvedInputs(['$dir/$name.acn', '$dir/$name.ist'], this.firstParameter)
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['$dir/$name.acr', '$dir/$name.alg', '$dir/$name.gls', '$dir/$name.glg'], this.firstParameter)
    return true
  }

  constructCommand () {
    const { dir, name } = path.parse(this.firstParameter.filePath)
    const args = ['makeglossaries']

    if (dir) args.push('-d', dir)
    args.push(name)

    return args
  }
}
