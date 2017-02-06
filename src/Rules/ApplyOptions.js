/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class ApplyOptions extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Apply options from YAML file and any LaTeX magic comments found in source file.'

  async initialize () {
    const ext = path.extname(this.filePath)
    await this.getResolvedInputs(['.yaml-ParsedYAML', `${ext}-ParsedLaTeXMagic`], { useJobName: false, useOutputDirectory: false })
  }

  async run () {
    for (const file: File of this.inputs.values()) {
      if (file.value) {
        delete file.value.test
        Object.assign(this.buildState.options, file.value)
      }
    }
    return true
  }
}
