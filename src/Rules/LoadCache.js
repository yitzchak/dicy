/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class LoadCache extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Loads the file/rule cache from a previous build.'

  cacheFilePath: string

  async initialize () {
    this.cacheFilePath = this.resolvePath('-cache.yaml', {
      absolute: true,
      useJobName: false,
      useOutputDirectory: false
    })
  }

  async preEvaluate () {
    if (this.options.ignoreCache || !await fs.exists(this.cacheFilePath)) this.actions.delete('run')
  }

  async run () {
    // $FlowIgnore
    const contents = await fs.readFile(this.cacheFilePath, { encoding: 'utf-8' })
    this.buildState.cache = yaml.safeLoad(contents)

    return true
  }
}
