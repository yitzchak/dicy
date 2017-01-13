/* @flow */

import fs from 'fs-promise'
import path from 'path'
import yaml from 'js-yaml'
import File from './File'
import Rule from './Rule'

export default class BuildState {
  filePath: string
  dir: string
  files: Map<string, File> = new Map()
  rules: Map<string, Rule> = new Map()
  options: Object = {}
  cache: Object

  constructor (filePath: string, options: Object = {}) {
    this.filePath = path.basename(filePath)
    this.dir = path.dirname(filePath)
    Object.assign(this.options, options)
  }

  static async create (filePath: string, options: Object = {}) {
    const buildState = new BuildState(filePath, options)

    await buildState.getFile(filePath)

    return buildState
  }

  normalizePath (filePath: string) {
    filePath = path.normalize(filePath)

    if (path.isAbsolute(filePath)) {
      const dirPaths: Array<string> = [
        this.dir
      ]

      for (const dir of dirPaths) {
        const candidateFilePath = path.relative(dir, filePath)
        if (!candidateFilePath.startsWith('..')) {
          return candidateFilePath
        }
      }
    }

    return filePath
  }

  resolveOutputPath (ext: string, suffix?: string) {
    let dir = this.dir
    let { name } = path.parse(this.filePath)

    if (this.options.jobName) {
      name = this.options.jobName
    }

    if (suffix) {
      name = `${name}-${suffix}`
    }

    if (this.options.outputDirectory) {
      dir = path.resolve(dir, this.options.outputDirectory)
    }

    return path.format({ dir, name, ext })
  }

  async addRule (rule: Rule) {
    console.log(`Add rule ${rule.constructor.name}`)
    this.rules.set(rule.id, rule)
    if (this.cache && this.cache.rules[rule.id]) {
      const cachedRule = this.cache.rules[rule.id]
      rule.timeStamp = cachedRule.timeStamp
      await rule.addInputFiles(cachedRule.inputFiles)
      await rule.addOutputFiles(cachedRule.outputFiles)
    }
  }

  async getFile (filePath: string): File {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.files.get(filePath)

    if (!file) {
      let timeStamp, hash

      if (this.cache && this.cache.files[filePath]) {
        timeStamp = this.cache.files[filePath].timeStamp
        hash = this.cache.files[filePath].hash
      }
      file = await File.create(path.resolve(this.dir, filePath), filePath, timeStamp, hash)
      this.files.set(filePath, file)
    }

    return file
  }

  setOptions (options: Object) {
    Object.assign(this.options, options)
  }

  getCacheFilePath () {
    return this.resolveOutputPath('.yaml', 'cache')
  }

  async loadCache () {
    const cacheFilePath = this.getCacheFilePath()
    if (await fs.exists(cacheFilePath)) {
      const contents = await fs.readFile(cacheFilePath)
      this.cache = yaml.safeLoad(contents)
    }
  }

  async saveCache () {
    const cacheFilePath = this.getCacheFilePath()
    const state = {
      filePath: this.filePath,
      options: this.options,
      files: {},
      rules: {}
    }

    for (const [filePath, file] of this.files.entries()) {
      state.files[filePath] = {
        timeStamp: file.timeStamp,
        hash: file.hash
      }

      if (file.type) state.files[filePath].type = file.type
    }

    for (const rule of this.rules.values()) {
      state.rules[rule.id] = {
        timeStamp: rule.timeStamp,
        inputFiles: Array.from(rule.inputFiles.keys()),
        outputFiles: Array.from(rule.outputFiles.keys())
      }
    }

    const serialized = yaml.safeDump(state)
    await fs.writeFile(cacheFilePath, serialized)
  }
}
