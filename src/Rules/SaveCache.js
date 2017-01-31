/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import File from '../File'
import Rule from '../Rule'

import type { Command, FileCache, Phase } from '../types'

export default class SaveCache extends Rule {
  static phases: Set<Phase> = new Set(['finalize'])
  static commands: Set<Command> = new Set(['build'])
  static alwaysEvaluate: boolean = true

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.resolvePath('-cache.yaml', {
      absolute: true,
      useJobName: false,
      useOutputDirectory: false
    })
  }

  async run () {
    const state = {
      filePath: this.filePath,
      options: this.options,
      files: {},
      rules: {}
    }

    for (const file: File of this.buildState.files.values()) {
      const fileCache: FileCache = {
        timeStamp: file.timeStamp,
        hash: file.hash,
        value: file.value,
        jobNames: Array.from(file.jobNames.values())
      }

      if (file.type) {
        fileCache.type = file.type
      }

      state.files[file.normalizedFilePath] = fileCache
    }

    for (const rule of this.buildState.rules.values()) {
      state.rules[rule.id] = {
        timeStamp: rule.timeStamp,
        inputs: Array.from(rule.inputs.keys()),
        outputs: Array.from(rule.outputs.keys())
      }
    }

    const serialized = yaml.safeDump(state, { skipInvalid: true })
    await fs.writeFile(this.cacheFilePath, serialized)

    return true
  }
}
