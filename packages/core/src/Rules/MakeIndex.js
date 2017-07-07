/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Action, CommandOptions } from '../types'

export default class MakeIndex extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set([
    'IndexControlFile',
    'BibRefControlFile',
    'NomenclatureControlFile'
  ])]
  static description: string = 'Runs makeindex on any index files.'

  async getFileActions (file: File): Promise<Array<Action>> {
    return [file.type === 'ParsedMakeIndexLog' ? 'updateDependencies' : 'run']
  }

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

    if (this.options.MakeIndex_style) stylePath = this.options.MakeIndex_style

    const args = [
      'makeindex',
      '-t', logPath,
      '-o', outputPath
    ]

    if (stylePath) {
      args.push('-s', stylePath)
    }

    if (this.options.MakeIndex_germanOrdering) {
      args.push('-g')
    }

    if (this.options.MakeIndex_letterOrdering) {
      args.push('-l')
    }

    if (this.options.MakeIndex_startPage) {
      args.push('-p', this.options.MakeIndex_startPage)
    }

    if (this.options.MakeIndex_thaiSupport) {
      args.push('-T')
    }

    args.push('$DIR_0/$BASE_0')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: [`${logPath}-ParsedMakeIndexLog`],
      outputs: [outputPath, logPath]
    }
  }
}
