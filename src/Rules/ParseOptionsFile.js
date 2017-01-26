/* @flow */

import fs from 'fs-promise'
import path from 'path'
import yaml from 'js-yaml'

import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class ParseOptionsFile extends Rule {
  static phases: Set<Phase> = new Set(['configure'])

  input: ?File
  output: ?File

  async initialize () {
    const { dir, name } = path.parse(this.filePath)
    this.input = await this.getInput(path.format({ dir, name, ext: '.yaml' }))
    this.output = await this.getOutput(path.format({ dir, name, ext: '.yaml-ParsedYAML' }))
  }

  async evaluate () {
    if (!this.input) return true
    const contents = await fs.readFile(this.input.filePath, { encoding: 'utf-8' })
    const value = yaml.safeLoad(contents)
    if (this.output) this.output.value = value
    return true
  }
}
