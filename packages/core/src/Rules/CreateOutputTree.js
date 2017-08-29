/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type { Command, OptionsInterface, Phase } from '../types'

export default class CreateOutputTree extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Create directory tree for aux files when `outputDirectory` is set.'

  static async appliesToPhase (state: State, command: Command, phase: Phase, options: OptionsInterface): Promise<boolean> {
    return this.commands.has(command) &&
      this.phases.has(phase) &&
      this.parameterTypes.length === 0 &&
      !!options.outputDirectory && options.outputDirectory !== '.'
  }

  async run () {
    const directories = await this.globPath('**/*', {
      types: 'directories',
      ignorePattern: `${this.options.outputDirectory || '.'}/**`
    })
    directories.unshift('.')

    await Promise.all(directories.map(directory => File.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory || '.', directory))))

    return true
  }
}
