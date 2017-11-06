import * as semver from 'semver'

import File from '../File'
import Rule from '../Rule'
import { CACHE_VERSION, Command, Phase, Cache } from '../types'

export default class LoadAndValidateCache extends Rule {
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static commands: Set<Command> = new Set<Command>(['load'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Loads the file/rule cache from a previous build.'

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.resolvePath('$ROOTDIR/$NAME-cache.yaml')
  }

  async run () {
    if (this.options.loadCache) {
      if (await File.canRead(this.cacheFilePath) && (!this.cacheTimeStamp ||
        this.cacheTimeStamp < await File.getModifiedTime(this.cacheFilePath))) {
        this.info('Loading build cache from disk as it is newer then in-memory build cache.')
        await this.loadCache()
      } else {
        if (this.options.validateCache) {
          this.info('Validating in-memory build cache.')
          await this.validateCache()
        } else {
          this.info('Skipping cache validation since `validateCache` is not set.')
        }
      }
    } else {
      this.info('Skipping loading build cache from disk since `loadCache` is not set.')
      await this.cleanCache()
    }

    // Get the main source file just in case it wasn't added by the cache load.
    // This also lets the cache load test for a change in the main source file.
    await this.getFile(this.filePath)

    return true
  }

  async cleanCache () {
    for (const jobName of this.options.jobNames) {
      for (const file of this.files) {
        await this.deleteFile(file, jobName, false)
      }
    }
  }

  async loadCache () {
    await this.cleanCache()

    this.cacheTimeStamp = await File.getModifiedTime(this.cacheFilePath)
    const cache: Cache | undefined = await File.readYaml(this.cacheFilePath)

    if (!cache) return true

    if (!cache.version) {
      this.warning('Skipping load of build cache since no version tag was found in the cache.')
      return true
    } else if (!semver.satisfies(cache.version, `^${CACHE_VERSION}`)) {
      this.warning(`Skipping load of build cache since version tag \`v${cache.version}\` does not match \`^${CACHE_VERSION}\`.`)
      return true
    }

    this.resetOptions()
    this.assignOptions(cache.options)

    if (cache.files) {
      for (const filePath in cache.files) {
        await this.addCachedFile(filePath, cache.files[filePath])
      }
    }

    if (cache.rules) {
      for (const rule of cache.rules) {
        await this.addCachedRule(rule)
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
        await this.deleteFile(file, jobName, false)
      }
    }

    for (const rule of this.rules) {
      for (const input of rule.inputs) {
        await rule.addFileActions(input)
      }
    }
  }
}
