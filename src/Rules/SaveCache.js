/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import File from '../File'
import Rule from '../Rule'

import type { Command, FileCache, Cache, RuleCache } from '../types'

export default class SaveCache extends Rule {
  static commands: Set<Command> = new Set(['save'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Saves file and rule status to a cache (-cache.yaml) to assist with rebuilding.'

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.expandPath(':dir/:name-cache.yaml')
  }

  async run () {
    const cache: Cache = {
      filePath: this.filePath,
      options: this.options,
      files: {},
      rules: []
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

      if (file.subType) {
        fileCache.subType = file.subType
      }

      cache.files[file.normalizedFilePath] = fileCache
    }

    for (const rule of this.rules) {
      const ruleCache: RuleCache = {
        name: rule.constructor.name,
        command: rule.command,
        phase: rule.phase,
        parameters: rule.parameters.map(file => file.normalizedFilePath),
        inputs: Array.from(rule.inputs.keys()),
        outputs: Array.from(rule.outputs.keys())
      }

      if (rule.jobName) {
        ruleCache.jobName = rule.jobName
      }

      cache.rules.push(ruleCache)
    }

    const serialized = yaml.safeDump(cache, { skipInvalid: true })
    await fs.writeFile(this.cacheFilePath, serialized)

    return true
  }
}
