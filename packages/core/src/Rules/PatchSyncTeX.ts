import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

function escapePath (filePath: string): string {
  return filePath.replace(/\\/g, '\\\\')
}

export default class PatchSyncTeX extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['finalize'],
    parameters: [['KnitrConcordance'], ['SyncTeX']]
  }]

  constructCommand (): CommandOptions {
    // Remove the concordance part of the file name because patchSynctex just
    // adds it back on. The first parameter is really supposed to be the Rnw
    // file, but patchSynctex has no way to know the output path of knit if
    // it is a custom value. If we pass the root name of the concordance file
    // then we can trick it into customizing the name.
    const filePath = escapePath(this.firstParameter.filePath.replace('-concordance', ''))
    // Remove the SyncTeX extensions because patchSynctex tries to guess it.
    const synctexPath = escapePath(this.secondParameter.filePath.replace(/\.synctex(\.gz)?$/i, ''))
    const lines = [
      'library(patchSynctex)',
      `patchSynctex('${filePath}',syncfile='${synctexPath}')`]

    // Set the severity to warning since patching the SyncTeX file is just a
    // nicety.
    return {
      command: ['Rscript', '-e', lines.join(';')],
      cd: '$ROOTDIR',
      severity: 'warning',
      outputs: [{ file: '$DIR_1/BASE_1' }]
    }
  }
}
