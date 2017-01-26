/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeGlossaries extends Rule {
  static fileTypes: Set<string> = new Set(['GlossaryControlFile'])

  async initialize (): Promise<void> {
    await this.getResolvedInputs('.acn', '.ist')
  }

  async postEvaluate (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs('.acr', '.alg', '.gls', '.glg')
    return true
  }

  constructCommand () {
    const { dir, name } = path.parse(this.firstParameter.normalizedFilePath)
    const args = []

    if (dir) args.push(`-d "${dir}"`)
    args.push(`"${name}"`)

    return `makeglossaries ${args.join(' ')}`
  }
}
