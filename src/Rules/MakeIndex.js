/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { ResolvePathOptions } from '../types'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile', 'BibRefControlFile', 'NomenclatureControlFile'])
  static description: string = 'Runs makeindex on any index files.'

  stylePath: string
  outputPath: string
  logPath: string

  async initialize () {
    const ext = path.extname(this.firstParameter.normalizedFilePath)
    const firstChar = ext[1]
    const resolvePathOptions: ResolvePathOptions = {
      referenceFile: this.firstParameter,
      useJobName: false,
      useOutputDirectory: false
    }

    this.logPath = this.resolvePath(`.${firstChar === 'b' ? 'br' : firstChar}lg`, resolvePathOptions)

    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        this.stylePath = 'nomencl.ist'
        this.outputPath = this.resolvePath('.nls', resolvePathOptions)
        break
      case 'BibRefControlFile':
        this.stylePath = 'bibref.ist'
        this.outputPath = this.resolvePath('.bnd', resolvePathOptions)
        break
      default:
        this.outputPath = this.resolvePath(`.${firstChar}nd`, resolvePathOptions)
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
