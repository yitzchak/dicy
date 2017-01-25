/* @flow */

import fs from 'fs-promise'
import path from 'path'
import yaml from 'js-yaml'
import File from './File'
import Rule from './Rule'
import type { Command, FileCache, Log, Message, Option, Phase } from './types'

export default class BuildState {
  filePath: string
  rootPath: string
  command: Command
  phase: Phase
  files: Map<string, File> = new Map()
  rules: Map<string, Rule> = new Map()
  options: Object = {}
  optionSchema: Map<string, Option> = new Map()
  cache: Object
  log: Log
  distances: Map<string, number> = new Map()

  constructor (filePath: string, options: Object = {}, schema: { [name: string]: Option } = {}, log: Log = (message: Message): void => {}) {
    this.filePath = path.basename(filePath)
    this.rootPath = path.dirname(filePath)
    this.log = log
    for (const name in schema) {
      const option = schema[name]
      this.optionSchema.set(name, option)
      if (option.defaultValue) this.options[name] = option.defaultValue
    }
    Object.assign(this.options, options)
  }

  static async create (filePath: string, options: Object = {}, schema: { [name: string]: Option } = {}, log: Log = (message: Message): void => {}) {
    const buildState = new BuildState(filePath, options, schema, log)

    if (!options.ignoreCache) await buildState.loadCache()
    await buildState.getFile(filePath)

    return buildState
  }

  normalizePath (filePath: string) {
    filePath = path.normalize(filePath)

    if (path.isAbsolute(filePath)) {
      const dirPaths: Array<string> = [
        this.rootPath
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

  resolveOutputPath (ext: string, jobName: ?string) {
    let dir = this.rootPath
    let { name } = path.parse(this.filePath)

    name = jobName || this.options.jobName || name

    if (this.options.outputDirectory) {
      dir = path.resolve(dir, this.options.outputDirectory)
    }

    return path.format({ dir, name, ext })
  }

  async addRule (rule: Rule) {
    this.rules.set(rule.id, rule)
    if (this.cache && this.cache.rules[rule.id]) {
      const cachedRule = this.cache.rules[rule.id]
      rule.timeStamp = cachedRule.timeStamp
      await rule.getInputs(cachedRule.inputs)
      await rule.getOutputs(cachedRule.outputs)
      if (rule.constructor.alwaysEvaluate) rule.addAction()
      for (const input of rule.inputs.values()) {
        await rule.addInputFileActions(input)
      }
    } else {
      rule.addAction()
    }
  }

  getRuleId (name: string, jobName: ?string, ...parameters: Array<File | string>): string {
    const items = parameters.map(item => (typeof item === 'string') ? this.normalizePath(item) : item.normalizedFilePath)
    items.unshift(jobName || '')
    items.unshift(this.phase || '')
    return `${name}(${items.join(';')})`
  }

  getRule (name: string, jobName: ?string, ...parameters: Array<File | string>): ?Rule {
    const id = this.getRuleId(name, jobName, ...parameters)
    return this.rules.get(id)
  }

  async getFile (filePath: string): Promise<?File> {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.files.get(filePath)

    if (!file) {
      let timeStamp, hash, value

      if (this.cache && this.cache.files[filePath]) {
        timeStamp = this.cache.files[filePath].timeStamp
        hash = this.cache.files[filePath].hash
        value = this.cache.files[filePath].value
      }
      file = await File.create(path.resolve(this.rootPath, filePath), filePath, timeStamp, hash, value)
      if (!file) return
      this.files.set(filePath, file)
    }

    return file
  }

  setOptions (options: Object) {
    Object.assign(this.options, options)
  }

  getCacheFilePath () {
    const { name } = path.parse(this.filePath)
    return path.format({
      dir: this.rootPath,
      name,
      ext: '-cache.yaml'
    })
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

    for (const file: File of this.files.values()) {
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

    for (const rule of this.rules.values()) {
      state.rules[rule.id] = {
        timeStamp: rule.timeStamp,
        inputs: Array.from(rule.inputs.keys()),
        outputs: Array.from(rule.outputs.keys())
      }
    }

    const serialized = yaml.safeDump(state, { skipInvalid: true })
    await fs.writeFile(cacheFilePath, serialized)
  }

  calculateDistances (): void {
    this.distances.clear()

    for (const from of this.rules.values()) {
      let rules = new Set([from])

      for (let distance = 1; distance < 2 * this.rules.size; distance++) {
        const newRules = new Set()
        for (const rule of rules.values()) {
          for (const output of rule.outputs.values()) {
            for (const adj of output.rules.values()) {
              const id = `${from.id} ${adj.id}`
              this.distances.set(id, Math.min(distance, this.distances.get(id) || Number.MAX_SAFE_INTEGER))
              newRules.add(adj)
            }
          }
        }
        rules = newRules
      }
    }
  }
}
