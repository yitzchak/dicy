/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile', 'BibRefControlFile', 'NomenclatureControlFile'])

  stylePath: string
  outputPath: string
  logPath: string

  async initialize () {
    const ext = path.extname(this.firstParameter.normalizedFilePath)
    const firstChar = ext[1]

    this.logPath = this.normalizePath(this.resolveOutputPath(`.${firstChar === 'b' ? 'br' : firstChar}lg`))

    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        this.stylePath = 'nomencl.ist'
        this.outputPath = this.normalizePath(this.resolveOutputPath('.nls'))
        break
      case 'BibRefControlFile':
        this.stylePath = 'bibref.ist'
        this.outputPath = this.normalizePath(this.resolveOutputPath('.bnd'))
        break
      default:
        this.outputPath = this.normalizePath(this.resolveOutputPath(`.${firstChar}nd`))
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
