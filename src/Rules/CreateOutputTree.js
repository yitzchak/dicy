/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class CreateOutputTree extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Create directory tree for aux files when `outputDirectory` is set.'

  async run () {
    if (this.options.outputDirectory) {
      await File.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory))
    }
    return true
  }
}
