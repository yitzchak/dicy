/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class ApplyOptions extends Rule {
  static phases: Set<Phase> = new Set(['configure'])

  async initialize () {
    const { dir, name, ext } = path.parse(this.filePath)
    const exts = ['.yaml-ParsedYAML', `${ext}-ParsedLaTeXMagic`]
    for (const ext of exts) {
      const file = await this.getInput(path.format({ dir, name, ext }))
      if (file) this.parameters.push(file)
    }
    this.id = this.buildState.getRuleId(this.constructor.name, this.jobName, ...this.parameters)
  }

  async evaluate () {
    for (const file: File of this.parameters) {
      if (file.value) Object.assign(this.buildState.options, file.value)
    }
    return true
  }
}
