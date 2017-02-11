/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile', 'BibRefControlFile', 'NomenclatureControlFile'])
  static description: string = 'Runs makeindex on any index files.'

  stylePath: string
  outputPath: string
  logPath: string

  async initialize () {
    const ext = path.extname(this.firstParameter.normalizedFilePath)
    const firstChar = ext[1]

    this.logPath = this.firstParameter.getRelatedPath(`.${firstChar === 'b' ? 'br' : firstChar}lg`)

    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        this.stylePath = 'nomencl.ist'
        this.outputPath = this.firstParameter.getRelatedPath('.nls')
        break
      case 'BibRefControlFile':
        this.stylePath = 'bibref.ist'
        this.outputPath = this.firstParameter.getRelatedPath('.bnd')
        break
      default:
        this.outputPath = this.firstParameter.getRelatedPath(`.${firstChar}nd`)
        break
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getOutputs([this.logPath, this.outputPath])
    return true
  }

  constructCommand () {
    const args = [
      'makeindex',
      '-t', this.logPath,
      '-o', this.outputPath
    ]

    if (this.stylePath) args.push('-s', this.stylePath)
    args.push(this.firstParameter.normalizedFilePath)

    return args
  }
}
