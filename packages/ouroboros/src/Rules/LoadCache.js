/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Command, Phase, RuleCache, Cache } from '../types'

export default class LoadCache extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Loads the file/rule cache from a previous build.'

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.resolvePath('$DIR/$NAME-cache.yaml')
  }

  async preEvaluate () {
    if (this.options.ignoreCache || !await File.canRead(this.cacheFilePath)) this.actions.delete('run')
  }

  async run () {
    const timeStamp: Date = await File.getModifiedTime(this.cacheFilePath)
    if (this.state.cacheTimeStamp && this.state.cacheTimeStamp >= timeStamp) return true

    this.state.cacheTimeStamp = timeStamp
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

      this.calculateDistances()
    }

    return true
  }
}
