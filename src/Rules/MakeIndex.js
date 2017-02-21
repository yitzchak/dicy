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

    this.logPath = this.expandPath(`:dir/:name.${firstChar === 'b' ? 'br' : firstChar}lg`, this.firstParameter)

    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        this.stylePath = 'nomencl.ist'
        this.outputPath = this.expandPath(':dir/:name.nls', this.firstParameter)
        break
      case 'BibRefControlFile':
        this.stylePath = 'bibref.ist'
        this.outputPath = this.expandPath(':dir/:name.bnd', this.firstParameter)
        break
      default:
        this.outputPath = this.expandPath(`:dir/:name.${firstChar}nd`, this.firstParameter)
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
