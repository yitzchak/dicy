/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import Rule from '../Rule'

import type { Command, Phase, RuleCache, Cache } from '../types'

export default class LoadCache extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Loads the file/rule cache from a previous build.'

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.expandPath(':dir/:name-cache.yaml')
  }

  async preEvaluate () {
    if (this.options.ignoreCache || !await fs.exists(this.cacheFilePath)) this.actions.delete('run')
  }

  async run () {
    // $FlowIgnore
    const contents = await fs.readFile(this.cacheFilePath, { encoding: 'utf-8' })
    const cache: ?Cache = yaml.safeLoad(contents)

    if (!cache) return true

    if (cache.files) {
      for (const filePath in cache.files) {
        await this.buildState.getFile(filePath, cache.files[filePath])
      }
    }

    if (cache.rules) {
      for (const rule: RuleCache of cache.rules) {
        this.buildState.addCachedRule(rule)
      }
    }

    return true
  }
}
