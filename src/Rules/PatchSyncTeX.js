/* @flow */

import Rule from '../Rule'

function escapePath (filePath) {
  return filePath.replace(/\\/g, '\\\\')
}

export default class PatchSyncTeX extends Rule {
  static fileTypes: Set<string> = new Set(['KnitrConcordance'])

  async preEvaluate () {
    if (!await this.getGeneratedInput('.synctex.gz')) this.actions.delete('run')
  }

  constructCommand () {
    const filePath = escapePath(this.buildState.filePath)
    const synctexPath = escapePath(this.resolveGeneratedPath(''))
    const lines = [
      'library(patchSynctex)',
      `patchSynctex('${filePath}',syncfile='${synctexPath}')`]

    return `Rscript -e "${lines.join(';')}"`
  }
}
