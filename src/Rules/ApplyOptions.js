/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class ApplyOptions extends Rule {
  static phases: Set<Phase> = new Set(['configure'])
  static alwaysEvaluate: boolean = true

  async initialize () {
    const { dir, name, ext } = path.parse(this.filePath)
    const exts = ['.yaml-ParsedYAML', `${ext}-ParsedLaTeXMagic`]
    for (const ext of exts) {
      await this.getInput(path.format({ dir, name, ext }))
    }
  }

  async run () {
    for (const file: File of this.inputs.values()) {
      if (file.value) Object.assign(this.buildState.options, file.value)
    }
    return true
  }
}
