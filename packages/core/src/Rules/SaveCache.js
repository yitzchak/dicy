/* @flow */

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
    this.cacheFilePath = this.resolvePath('$ROOTDIR/$NAME-cache.yaml')
  }

  async preEvaluate () {
    // If all output files are virtual the don't bother saving.
    if (Array.from(this.rules).every(rule => rule.outputs.every(file => file.virtual))) {
      this.actions.delete('run')
    }
  }

  async run () {
    const cache: Cache = {
      filePath: this.filePath,
      options: this.state.options,
      files: {},
      rules: []
    }

    // Loop through all the files and add them to the cache.
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

      cache.files[file.filePath] = fileCache
    }

    // Loop through all the rules and add them to the cache.
    for (const rule of this.rules) {
      const ruleCache: RuleCache = {
        name: rule.constructor.name,
        command: rule.command,
        phase: rule.phase,
        parameters: rule.parameters.map(file => file.filePath),
        inputs: rule.inputs.map(file => file.filePath),
        outputs: rule.outputs.map(file => file.filePath)
      }

      if (rule.options.jobName) {
        ruleCache.jobName = rule.options.jobName
      }

      cache.rules.push(ruleCache)
    }

    // Save the cache and update the timestamp.
    await File.safeDump(this.cacheFilePath, cache)
    this.state.cacheTimeStamp = await File.getModifiedTime(this.cacheFilePath)

    return true
  }
}
