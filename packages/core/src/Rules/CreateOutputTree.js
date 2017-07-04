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
      const directories = await this.globPath('**/*', {
        types: 'directories',
        ignorePattern: `${this.options.outputDirectory}/**`
      })
      directories.unshift('.')
      await Promise.all(directories.map(directory => File.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory, directory))))
    }
    return true
  }
}
