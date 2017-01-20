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
  static priority: number = 100

  static async analyze (buildState: BuildState, jobName: ?string, file: File): Promise<?Rule> {
    if (this.phases.has(buildState.phase) && file.normalizedFilePath === buildState.filePath) {
      const { dir, name } = path.parse(file.normalizedFilePath)
      const optionsFilePath = path.format({ dir, name, ext: '.yaml' })
      const optionsFile = await buildState.getFile(optionsFilePath)
      if (optionsFile) return new this(buildState, undefined, optionsFile)
    }
  }

  async evaluate () {
    const parsedFile = await this.getOutput(`${this.firstParameter.normalizedFilePath}-ParsedYAML`)
    if (!parsedFile) return false
    const contents = await fs.readFile(this.firstParameter.filePath)
    parsedFile.contents = yaml.safeLoad(contents)
    parsedFile.forceUpdate()

    return true
  }
}
