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
    // .brlg instead of .blg is used as extension to avoid ovewriting any
    // Biber/BibTeX logs.
    const logPath = `$DIR_0/$NAME_0.${firstChar === 'b' ? 'br' : firstChar}lg`
    let stylePath
    let outputPath

    // Automatically assign output path and style based on index type.
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

    // Allow the MakeIndex_style option to override the default style selection.
    if (this.options.MakeIndex_style) stylePath = this.options.MakeIndex_style

    const args = [
      'makeindex',
      '-t', logPath,
      '-o', outputPath
    ]

    if (stylePath) {
      args.push('-s', stylePath)
    }

    // Remove blanks from index ids
    if (this.options.MakeIndex_compressBlanks) {
      args.push('-c')
    }

    // Ignore spaces in grouping.
    if (this.options.MakeIndex_ordering === 'letter') {
      args.push('-l')
    }

    // It is possible to have all of these enabled at the same time, but
    // inspection of the makeindex code seems to indicate that `thai` implies
    // `locale` and that `locale` prevents `german` from being used.
    switch (this.options.MakeIndex_sorting) {
      case 'german':
        args.push('-g')
        break
      case 'thai':
        args.push('-T')
        break
      case 'locale':
        args.push('-L')
        break
    }

    // Specify the starting page.
    if (this.options.MakeIndex_startPage) {
      args.push('-p', this.options.MakeIndex_startPage)
    }

    // Prevent automatic range construction.
    if (!this.options.MakeIndex_automaticRanges) {
      args.push('-r')
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
