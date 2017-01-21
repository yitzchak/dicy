/* @flow */

import fs from 'fs-promise'
import path from 'path'
import yaml from 'js-yaml'

import Rule from '../Rule'

import type { Phase } from '../types'

export default class ParseOptionsFile extends Rule {
  static phases: Set<Phase> = new Set(['configure'])

  async initialize () {
    const { dir, name } = path.parse(this.filePath)
    const exts = ['.yaml', `.yaml-ParsedYAML`]
    for (const ext of exts) {
      const file = await this.getInput(path.format({ dir, name, ext }))
      if (file) this.parameters.push(file)
    }
    this.id = this.buildState.getRuleId(this.constructor.name, this.jobName, ...this.parameters)
  }

  async evaluate () {
    if (!this.firstParameter || !this.secondParameter) return false
    const contents = await fs.readFile(this.firstParameter.filePath, { encoding: 'utf-8' })
    const value = yaml.safeLoad(contents)
    this.secondParameter.value = value
    return true
  }
}
