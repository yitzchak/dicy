/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile', 'NomenclatureControlFile'])

  stylePath: string
  outputPath: string
  logPath: string

  async initialize () {
    const ext = path.extname(this.firstParameter.normalizedFilePath)

    this.logPath = this.normalizePath(this.resolveOutputPath(`.${ext[1]}lg`))

    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        this.stylePath = 'nomencl.ist'
        this.outputPath = this.normalizePath(this.resolveOutputPath('.nls'))
        break
      default:
        this.outputPath = this.normalizePath(this.resolveOutputPath(`.${ext[1]}nd`))
        break
    }
  }

  async postEvaluate (stdout: string, stderr: string): Promise<boolean> {
    await this.getOutputs([this.logPath, this.outputPath])
    return true
  }

  constructCommand () {
    const args = [
      `-t "${this.logPath}"`,
      `-o "${this.outputPath}"`
    ]

    if (this.stylePath) args.push(`-s "${this.stylePath}"`)
    args.push(`"${this.firstParameter.normalizedFilePath}"`)

    return `makeindex ${args.join(' ')}`
  }
}
