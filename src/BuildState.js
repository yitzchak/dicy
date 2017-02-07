/* @flow */

import EventEmitter from 'events'
import path from 'path'
import File from './File'
import Rule from './Rule'

import type { Command, Option, Phase } from './types'

export default class BuildState extends EventEmitter {
  filePath: string
  rootPath: string
  command: Command
  phase: Phase
  files: Map<string, File> = new Map()
  rules: Map<string, Rule> = new Map()
  options: Object = {}
  optionSchema: Map<string, Option> = new Map()
  cache: Object
  distances: Map<string, number> = new Map()

  constructor (filePath: string, options: Object = {}, schema: { [name: string]: Option } = {}) {
    super()
    this.filePath = path.basename(filePath)
    this.rootPath = path.dirname(filePath)
    for (const name in schema) {
      const option = schema[name]
      this.optionSchema.set(name, option)
      if (option.defaultValue) this.options[name] = option.defaultValue
    }
    Object.assign(this.options, options)
  }

  static async create (filePath: string, options: Object = {}, schema: { [name: string]: Option } = {}) {
    const buildState = new BuildState(filePath, options, schema)

    await buildState.getFile(filePath)

    return buildState
  }

  normalizePath (filePath: string): string {
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

  async addRule (rule: Rule): Promise<void> {
    this.rules.set(rule.id, rule)
    // Look for the rule in the cache
    if (this.cache && this.cache.rules[rule.id]) {
      const cachedRule = this.cache.rules[rule.id]
      await rule.getInputs(cachedRule.inputs)
      const outputs = await rule.getOutputs(cachedRule.outputs)
      if (outputs.length === cachedRule.outputs.length) {
        // All outputs still exist so we used the cached timeStamp.
        rule.timeStamp = cachedRule.timeStamp
        if (rule.constructor.alwaysEvaluate) rule.addAction()
      } else {
        // At least one of the outputs is missing so we force evaluation of the
        // rule.
        rule.addAction()
      }
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
    items.unshift(this.command || '')
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

      // Check for the file in the cache
      if (this.cache && this.cache.files[filePath]) {
        timeStamp = this.cache.files[filePath].timeStamp
        hash = this.cache.files[filePath].hash
        value = this.cache.files[filePath].value
      }
      file = await File.create(path.resolve(this.rootPath, filePath), filePath, timeStamp, hash, value)
      if (!file) {
        // the file no longer exists so we remove it from the cache. This
        // guarantees that even if the file is recreated with the same timeStamp
        // and hash it will still trigger dependent rules.
        if (this.cache) delete this.cache.files[filePath]
        this.emit('fileRemoved', { type: 'fileRemoved', file: filePath })
        return
      }
      this.emit('fileAdded', { type: 'fileAdded', file: filePath })
      this.files.set(filePath, file)
    }

    return file
  }

  setOptions (options: Object) {
    Object.assign(this.options, options)
  }

  getOption (name: string, jobName: ?string): ?any {
    if (name === 'jobNames') {
      if ('jobName' in this.options) return [this.options.jobName]
      if ('jobNames' in this.options) return this.options.jobNames
      if ('jobs' in this.options) return Object.keys(this.options.jobs)
      return []
    }

    if (jobName) {
      if (name === 'jobName') return jobName
      if ('jobs' in this.options) {
        const jobOptions = this.options.jobs[jobName]
        if (jobOptions && name in jobOptions) return jobOptions[name]
      }
    }

    return this.options[name]
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

  getDistance (x: Rule, y: Rule): ?number {
    return this.distances.get(`${x.id} ${y.id}`)
  }

  isConnected (x: Rule, y: Rule): boolean {
    return this.distances.has(`${x.id} ${y.id}`) || this.distances.has(`${y.id} ${x.id}`)
  }

  isChild (x: Rule, y: Rule): boolean {
    return this.getDistance(x, y) === 1
  }
}
