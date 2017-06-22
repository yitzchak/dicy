/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Command, Phase, RuleCache, Cache } from '../types'

export default class LoadAndValidateCache extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Loads the file/rule cache from a previous build.'

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.resolvePath('$DIR/$NAME-cache.yaml')
  }

  async run () {
    if (this.options.ignoreCache) {
      this.cleanCache()
    } else {
      if (await File.canRead(this.cacheFilePath) && (!this.state.cacheTimeStamp ||
        this.state.cacheTimeStamp < await File.getModifiedTime(this.cacheFilePath))) {
        await this.loadCache()
      } else {
        await this.validateCache()
      }
    }

    // Get the main source file just in case it wasn't added by the cache load.
    // This also lets the cache load test for a change in the main source file.
    await this.getFile(this.filePath)

    this.calculateDistances()

    return true
  }

  cleanCache () {
    for (const jobName of this.options.jobNames) {
      for (const file of this.files) {
        if (file.filePath !== this.filePath) {
          this.state.deleteFile(file, jobName, false)
        }
      }
    }
  }

  async loadCache () {
    this.cleanCache()

    this.state.cacheTimeStamp = await File.getModifiedTime(this.cacheFilePath)
    const cache: ?Cache = await File.safeLoad(this.cacheFilePath)

    if (!cache) return true

    this.state.options = cache.options

    if (cache.files) {
      for (const filePath in cache.files) {
        await this.state.getFile(filePath, cache.files[filePath])
      }
    }

    if (cache.rules) {
      for (const rule: RuleCache of cache.rules) {
        await this.state.addCachedRule(rule)
      }
    }
  }

  async validateCache () {
    const files = []

    for (const file of this.files) {
      if (!file.virtual) {
        if (await file.canRead()) {
          await file.update()
        } else {
          files.push(file)
        }
      }
    }

    for (const jobName of this.options.jobNames) {
      for (const file of files) {
        this.state.deleteFile(file, jobName, false)
      }
    }

    for (const rule of this.rules) {
      for (const input of rule.inputs.values()) {
        await rule.addFileActions(input)
      }
    }
  }
}
