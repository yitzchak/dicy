/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import File from '../File'
import Rule from '../Rule'

import type { Command, FileCache } from '../types'

export default class SaveCache extends Rule {
  static commands: Set<Command> = new Set(['save'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Saves file and rule status to a cache (-cache.yaml) to assist with rebuilding.'

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

    for (const file: File of this.files) {
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

    for (const rule of this.rules) {
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
