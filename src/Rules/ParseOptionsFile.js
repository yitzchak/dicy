/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class ParseOptionsFile extends Rule {
  static phases: Set<Phase> = new Set(['configure'])

  input: ?File
  output: ?File

  async initialize () {
    this.input = await this.getSourceInput('.yaml')
    this.output = await this.getSourceOutput('.yaml-ParsedYAML')
  }

  async run () {
    if (!this.input) return true
    // $FlowIgnore
    const contents = await fs.readFile(this.input.filePath, { encoding: 'utf-8' })
    const value = yaml.safeLoad(contents)
    if (this.output) this.output.value = value
    return true
  }
}
