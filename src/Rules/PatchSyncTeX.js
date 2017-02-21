/* @flow */

import Rule from '../Rule'

import type { Phase } from '../types'

function escapePath (filePath) {
  return filePath.replace(/\\/g, '\\\\')
}

export default class PatchSyncTeX extends Rule {
  static fileTypes: Set<string> = new Set(['KnitrConcordance'])
  static phases: Set<Phase> = new Set(['finalize'])
  static description: string = 'Patches SyncTeX files if LaTeX document was generated by knitr so PDF reverse sync will work.'

  constructCommand () {
    const filePath = escapePath(this.filePath)
    const synctexPath = escapePath(this.resolvePath(':outdir/:job'))
    const lines = [
      'library(patchSynctex)',
      `patchSynctex('${filePath}',syncfile='${synctexPath}')`]

    return ['Rscript', '-e', lines.join(';')]
  }
}
