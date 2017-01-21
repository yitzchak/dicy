/* @flow */

import fs from 'fs-promise'
import path from 'path'
import yaml from 'js-yaml'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'

import type { Phase } from '../types'

export default class ParseOptionsFile extends Rule {
  static phases: Set<Phase> = new Set(['configure'])

  parsedFile: ?File

  async initialize () {
    this.parsedFile = await this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedYAML`)
  }

  static async analyze (buildState: BuildState, jobName: ?string, file: File): Promise<?Rule> {
    if (this.phases.has(buildState.phase) && file.normalizedFilePath === buildState.filePath) {
      const { dir, name } = path.parse(file.normalizedFilePath)
      const optionsFilePath = path.format({ dir, name, ext: '.yaml' })
      const optionsFile = await buildState.getFile(optionsFilePath)
      if (optionsFile) {
        const rule = new this(buildState, undefined, optionsFile)
        await rule.initialize()
        return rule
      }
    }
  }

  async evaluate () {
    const contents = await fs.readFile(this.firstParameter.filePath, { encoding: 'utf-8' })
    const value = yaml.safeLoad(contents)
    if (this.parsedFile && value) this.parsedFile.value = value

    return true
  }
}
