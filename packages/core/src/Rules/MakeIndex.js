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

  constructCommand (): CommandOptions {
    const ext = path.extname(this.firstParameter.filePath)
    const firstChar = ext[1]
    const logPath = `$DIR_0/$NAME_0.${firstChar === 'b' ? 'br' : firstChar}lg`
    let stylePath
    let outputPath

    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        stylePath = 'nomencl.ist'
        outputPath = '$DIR_0/$NAME_0.nls'
        break
      case 'BibRefControlFile':
        stylePath = 'bibref.ist'
        outputPath = '$DIR_0/$NAME_0.bnd'
        break
      default:
        outputPath = `$DIR_0/$NAME_0.${firstChar}nd`
        break
    }

    const args = [
      'makeindex',
      '-t', logPath,
      '-o', outputPath
    ]

    if (stylePath) args.push('-s', stylePath)
    args.push('$DIR_0/$BASE_0')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [outputPath, logPath]
    }
  }
}
