/* @flow */

import path from 'path'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class ApplyOptions extends Rule {
  static phases: Set<Phase> = new Set(['configure'])

  static async analyze (buildState: BuildState, jobName: ?string, file: File): Promise<?Rule> {
    if (this.phases.has(buildState.phase) && file.normalizedFilePath === buildState.filePath) {
      const { dir, name } = path.parse(file.normalizedFilePath)
      const optionsFilePath = path.format({ dir, name, ext: '.yaml-ParsedYAML' })
      const optionsFile = await buildState.getFile(optionsFilePath)
      const magicFile = await buildState.getFile(`${file.normalizedFilePath}-ParsedLaTeXMagic`)
      if (optionsFile && magicFile) return new this(buildState, undefined, magicFile, optionsFile)
    }
  }

  async evaluate () {
    for (const file: File of this.parameters) {
      if (file.value) Object.assign(this.buildState.options, file.value)
    }
    return true
  }
}
