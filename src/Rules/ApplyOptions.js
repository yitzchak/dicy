/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class ApplyOptions extends Rule {
  static phases: Set<Phase> = new Set(['configure'])
  static alwaysEvaluate: boolean = true

  async initialize () {
    const ext = path.extname(this.filePath)
    await this.getResolvedInputs(['.yaml-ParsedYAML', `${ext}-ParsedLaTeXMagic`], { useJobName: false, useOutputDirectory: false })
  }

  async run () {
    for (const file: File of this.inputs.values()) {
      if (file.value) Object.assign(this.buildState.options, file.value)
    }
    return true
  }
}
