/* @flow */

import semver from 'semver'

import File from '../File'
import Rule from '../Rule'
import { CACHE_VERSION } from '../types'

import type { Command, Phase, RuleCache, Cache } from '../types'

export default class LoadAndValidateCache extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Loads the file/rule cache from a previous build.'

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.resolvePath('$ROOTDIR/$NAME-cache.yaml')
  }

  async run () {
    if (this.options.loadCache) {
      if (await File.canRead(this.cacheFilePath) && (!this.state.cacheTimeStamp ||
        this.state.cacheTimeStamp < await File.getModifiedTime(this.cacheFilePath))) {
        this.info('Loading build cache from disk as it is newer then in-memory build cache.')
        await this.loadCache()
      } else {
        this.info('Validating in-memory build cache.')
        await this.validateCache()
      }
    } else {
      this.info('Skipping loading build cache from disk since `loadCache` is not set.')
      this.cleanCache()
    }

    // Get the main source file just in case it wasn't added by the cache load.
    // This also lets the cache load test for a change in the main source file.
    await this.getFile(this.filePath)

    return true
  }

  cleanCache () {
    for (const jobName of this.options.jobNames) {
      for (const file of this.files) {
        this.state.deleteFile(file, jobName, false)
      }
    }
  }

  async loadCache () {
    this.cleanCache()

    this.state.cacheTimeStamp = await File.getModifiedTime(this.cacheFilePath)
    const cache: ?Cache = await File.safeLoad(this.cacheFilePath)

    if (!cache) return true

    if (!cache.version) {
      this.warning('Skipping load of build cache since no version tag was found in the cache.')
    } else if (!semver.satisfies(cache.version, `^${CACHE_VERSION}`)) {
      this.warning(`Skipping load of build cache since version tag \`v${cache.version}\` does not match \`^${CACHE_VERSION}\`.`)
      return true
    }

    this.state.assignOptions(cache.options)

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
      for (const input of rule.inputs) {
        await rule.addFileActions(input)
      }
    }
  }
}
