/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { CommandOptions } from '../types'

export default class MakeIndex extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set([
    'IndexControlFile',
    'BibRefControlFile',
    'NomenclatureControlFile'
  ])]
  static description: string = 'Runs makeindex on any index files.'

  stylePath: string
  outputPath: string
  logPath: string

  async initialize () {
    const ext = path.extname(this.firstParameter.filePath)
    const firstChar = ext[1]

    this.logPath = this.resolvePath(`$DIR_0/$NAME_0.${firstChar === 'b' ? 'br' : firstChar}lg`)

    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        this.stylePath = 'nomencl.ist'
        this.outputPath = this.resolvePath('$DIR_0/$NAME_0.nls')
        break
      case 'BibRefControlFile':
        this.stylePath = 'bibref.ist'
        this.outputPath = this.resolvePath('$DIR_0/$NAME_0.bnd')
        break
      default:
        this.outputPath = this.resolvePath(`$DIR_0/$NAME_0.${firstChar}nd`)
        break
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getOutputs([this.logPath, this.outputPath])
    return true
  }

  constructCommand (): CommandOptions {
    const args = [
      'makeindex',
      '-t', this.logPath,
      '-o', this.outputPath
    ]

    if (this.stylePath) args.push('-s', this.stylePath)
    args.push(this.firstParameter.filePath)

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error'
    }
  }
}
