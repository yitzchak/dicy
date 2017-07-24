/* @flow */

import _ from 'lodash'
import { alg, Graph } from 'graphlib'
import EventEmitter from 'events'
import path from 'path'

import File from './File'
import Rule from './Rule'

import type { Command, FileCache, RuleCache, Phase, Option, KillToken } from './types'

export default class State extends EventEmitter {
  filePath: string
  rootPath: string
  files: Map<string, File> = new Map()
  rules: Map<string, Rule> = new Map()
  options: Object = {}
  defaultOptions: Object = {}
  optionSchema: Map<string, Option> = new Map()
  ruleQueue: Array<Rule> = []
  // distances: Map<string, number> = new Map()
  ruleClasses: Array<Class<Rule>> = []
  cacheTimeStamp: Date
  processes: Set<number> = new Set()
  env: Object
  targets: Set<string> = new Set()
  killToken: ?KillToken
  graph: Graph = new Graph()

  constructor (filePath: string, schema: Array<Option> = []) {
    super()
    const resolveFilePath = path.resolve(filePath)
    const { dir, base, name, ext } = path.parse(resolveFilePath)
    this.filePath = base
    this.rootPath = dir
    for (const option of schema) {
      this.optionSchema.set(option.name, option)
      for (const alias of option.aliases || []) {
        this.optionSchema.set(alias, option)
      }
      if (option.defaultValue) this.defaultOptions[option.name] = option.defaultValue
    }
    this.assignOptions(this.defaultOptions)

    this.env = Object.assign({}, process.env, {
      ROOTDIR: dir,
      DIR: '.',
      BASE: base,
      NAME: name,
      EXT: ext
    })
    if (process.platform === 'win32') {
      Object.assign(this.env, {
        HOME: process.env.USERPROFILE,
        PATH: process.env.Path
      })
    }
  }

  static async create (filePath: string, schema: Array<Option> = []) {
    const state = new State(filePath, schema)

    // I've removed this line to allow for the cache to test for a file update
    // in the main source file. This make the async not really needed anymore,
    // but I'll leave for a bit just in case.
    // await state.getFile(filePath)

    return state
  }

  async getTargetPaths (absolute: boolean = false): Promise<Array<string>> {
    const results: Array<string> = []
    for (const target of this.targets.values()) {
      const file = await this.getFile(target)
      if (file) results.push(absolute ? file.realFilePath : target)
    }
    return results
  }

  async getTargetFiles (): Promise<Array<File>> {
    const results: Array<File> = []
    for (const target of this.targets.values()) {
      const file = await this.getFile(target)
      if (file) results.push(file)
    }
    return results
  }

  removeTarget (filePath: string) {
    this.targets.delete(filePath)
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
    this.graph.setNode(rule.id)
    rule.addActions()
  }

  removeRule (rule: Rule) {
    this.rules.delete(rule.id)
    this.graph.removeNode(rule.id)
    for (const file of this.files.values()) {
      file.removeAsInputOf(rule)
      file.removeAsOutputOf(rule)
    }
  }

  async addCachedRule (cache: RuleCache): Promise<void> {
    const id = this.getRuleId(cache.name, cache.command, cache.phase, cache.jobName, ...cache.parameters)
    if (this.rules.has(id)) return

    const RuleClass = this.ruleClasses.find(ruleClass => ruleClass.name === cache.name)
    if (RuleClass) {
      const parameters = []
      for (const filePath of cache.parameters) {
        const parameter = await this.getFile(filePath)
        if (!parameter) break
        parameters.push(parameter)
      }
      // $FlowIgnore
      const rule = new RuleClass(this, cache.command, cache.phase, cache.jobName, ...parameters)
      await rule.initialize()
      this.rules.set(rule.id, rule)
      await rule.getInputs(cache.inputs)
      const outputs = await rule.getOutputs(cache.outputs)
      if (rule.constructor.alwaysEvaluate || outputs.length !== cache.outputs.length) {
        // At least one of the outputs is missing or the rule should always run.
        rule.addActions()
      }
      for (const input of rule.inputs.values()) {
        await rule.addFileActions(input)
      }
    }
  }

  getRuleId (name: string, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File | string>): string {
    const items = parameters.map(item => (typeof item === 'string') ? this.normalizePath(item) : item.filePath)
    items.unshift(jobName || '')
    items.unshift(phase || '')
    items.unshift(command || '')
    return `${name}(${items.join(';')})`
  }

  getRule (name: string, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File | string>): ?Rule {
    const id = this.getRuleId(name, command, phase, jobName, ...parameters)
    return this.rules.get(id)
  }

  async getFile (filePath: string, { timeStamp, hash, value }: FileCache = {}): Promise<?File> {
    filePath = this.normalizePath(filePath)
    let file: ?File = this.files.get(filePath)

    if (!file) {
      file = await File.create(path.resolve(this.rootPath, filePath), filePath, timeStamp, hash, value)
      if (!file) {
        this.graph.removeNode(filePath)
        this.emit('fileRemoved', {
          type: 'fileRemoved',
          file: filePath
        })
        return
      }
      this.graph.setNode(filePath)
      this.emit('fileAdded', {
        type: 'fileAdded',
        file: filePath,
        virtual: file.virtual
      })
      this.files.set(filePath, file)
    }

    return file
  }

  async deleteFile (file: File, jobName: ?string, unlink: boolean = true) {
    const invalidRules = []

    for (const rule of this.rules.values()) {
      if (rule.jobName === jobName) {
        if (await rule.removeFile(file)) {
          // This file is one of the parameters of the rule so we need to remove
          // the rule.
          invalidRules.push(rule)
        }
      }
    }

    for (const rule of invalidRules) {
      this.graph.removeNode(rule.id)
      this.rules.delete(rule.id)
    }

    if (jobName) file.jobNames.delete(jobName)
    if (file.jobNames.size === 0) {
      if (unlink) await file.delete()
      this.graph.removeNode(file.filePath)
      this.files.delete(file.filePath)
      this.emit('fileDeleted', {
        type: 'fileDeleted',
        file: file.filePath,
        virtual: file.virtual
      })
    }
  }

  assignSubOptions (to: Object, from: Object) {
    for (const name in from) {
      if (from.hasOwnProperty(name)) {
        const value = from[name]
        if (typeof value !== 'object' || Array.isArray(value)) {
          const schema = this.optionSchema.get(name)
          if (schema) {
            to[schema.name] = value
          } else if (name.startsWith('$')) {
            // It's an environment variable
            to[name] = value
          } else {
            // Tell somebody!
          }
        } else {
          if (!(name in to)) to[name] = {}
          this.assignSubOptions(to[name], value)
        }
      }
    }
  }

  assignOptions (options: Object) {
    this.assignSubOptions(this.options, options)
  }

  resetOptions () {
    for (const name of Object.getOwnPropertyNames(this.options)) {
      delete this.options[name]
    }

    this.assignOptions(this.defaultOptions)
  }

  getOption (name: string, jobName: ?string): ?any {
    if (name === 'jobNames') {
      if ('jobName' in this.options) return [this.options.jobName]
      if ('jobNames' in this.options) return this.options.jobNames
      if ('jobs' in this.options) return Object.keys(this.options.jobs)
      return [undefined]
    }

    if (jobName) {
      if (name === 'jobName') return jobName
      if ('jobs' in this.options) {
        const jobOptions = this.options.jobs[jobName]
        if (jobOptions && name in jobOptions) return jobOptions[name]
      }
    }

    return (name === 'filePath') ? this.filePath : this.options[name]
  }

  * getOptions (jobName: ?string): Iterable<[string, any]> {
    if (jobName && 'jobs' in this.options && jobName in this.options.jobs) {
      const jobOptions = this.options.jobs[jobName]

      for (const name in jobOptions) {
        yield [name, jobOptions]
      }

      for (const name in this.options) {
        if (name === 'jobs' || name in jobOptions) continue
        yield [name, this.options[name]]
      }
    } else {
      for (const name in this.options) {
        if (name !== 'jobs') yield [name, this.options[name]]
      }
    }
  }

  calculateDistances (): void {
    const tarjan = _.flatten(alg.tarjan(this.graph))

    tarjan.reverse()
    // $FlowIgnore
    this.ruleQueue = tarjan.map(x => this.rules.get(x)).filter(r => r)
  }
  //   this.distances.clear()
  //
  //   for (const from of this.rules.values()) {
  //     let rules = new Set([from])
  //
  //     for (let distance = 1; distance < 2 * this.rules.size; distance++) {
  //       const newRules = new Set()
  //       for (const rule of rules.values()) {
  //         for (const output of rule.outputs.values()) {
  //           for (const adj of output.inputsOf.values()) {
  //             const id = `${from.id} ${adj.id}`
  //             this.distances.set(id, Math.min(distance, this.distances.get(id) || Number.MAX_SAFE_INTEGER))
  //             newRules.add(adj)
  //           }
  //         }
  //       }
  //       rules = newRules
  //     }
  //   }
  // }
  //
  // getDistance (x: Rule, y: Rule): ?number {
  //   return this.distances.get(`${x.id} ${y.id}`)
  // }
  //
  // isConnected (x: Rule, y: Rule): boolean {
  //   return this.distances.has(`${x.id} ${y.id}`) || this.distances.has(`${y.id} ${x.id}`)
  // }

  isChild (x: Rule, y: Rule): boolean {
    return this.graph.predecessors(x.id).some(file => this.graph.predecessors(file).some(r => r === y.id))
  }
}
