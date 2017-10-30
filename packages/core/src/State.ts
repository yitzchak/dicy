import { alg, Graph } from 'graphlib'
import { EventEmitter } from 'events'
import * as path from 'path'

import File from './File'
import Rule from './Rule'

import {
  Command,
  FileCache,
  KillToken,
  Option,
  OptionsInterface,
  OptionInterfaceMap,
  Phase,
  RuleCache,
  DEFAULT_OPTIONS
} from './types'

function getLabel (x: File | Rule): string {
  return (x instanceof File) ? x.filePath : x.id
}

type GraphProperties = {
  components?: Rule[][]
}

export default class State extends EventEmitter {
  filePath: string
  rootPath: string
  files: Map<string, File> = new Map()
  rules: Map<string, Rule> = new Map()
  options: {[name: string]: any} = {}
  defaultOptions: OptionsInterface
  optionSchema: Map<string, Option> = new Map()
  private graphProperties: GraphProperties = {}
  ruleClasses: typeof Rule[] = []
  cacheTimeStamp: Date
  processes: Set<number> = new Set<number>()
  env: {[name: string]: string}
  targets: Set<string> = new Set<string>()
  killToken: KillToken | null
  graph: Graph = new Graph()
  optionProxies: Map<string | null, OptionsInterface> = new Map<string | null, OptionsInterface>()

  constructor (filePath: string, schema: Option[] = []) {
    super()
    const resolveFilePath: string = path.resolve(filePath)
    const { dir, base, name, ext } = path.parse(resolveFilePath)
    this.filePath = base
    this.rootPath = dir
    this.defaultOptions = <OptionsInterface>{}
    for (const option of schema) {
      this.optionSchema.set(option.name, option)
      for (const alias of option.aliases || []) {
        this.optionSchema.set(alias, option)
      }
      if (option.defaultValue) this.defaultOptions[option.name] = option.defaultValue
    }
    this.assignOptions(this.defaultOptions)

    this.env = Object.assign({}, process.env, {
      FILEPATH: base,
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

  async getTargetPaths (absolute: boolean = false): Promise<string[]> {
    const results: string[] = []
    for (const target of this.targets.values()) {
      const file: File | undefined = await this.getFile(target)
      if (file) results.push(absolute ? file.realFilePath : target)
    }
    return results
  }

  async getTargetFiles (): Promise<File[]> {
    const results: File[] = []
    for (const target of this.targets.values()) {
      const file: File | undefined = await this.getFile(target)
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
      const dirPaths: string[] = [
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
    this.addNode(rule.id)
    rule.addActions()
  }

  removeRule (rule: Rule) {
    this.rules.delete(rule.id)
    this.removeNode(rule.id)
  }

  async addCachedRule (cache: RuleCache): Promise<void> {
    const options: OptionsInterface = this.getJobOptions(cache.jobName)
    const id: string = this.getRuleId(cache.name, cache.command, cache.phase, cache.jobName, cache.parameters)
    if (this.rules.has(id)) return

    const RuleClass = this.ruleClasses.find(ruleClass => ruleClass.name === cache.name)
    if (RuleClass) {
      const parameters: File[] = []
      for (const filePath of cache.parameters) {
        const parameter: File | undefined = await this.getFile(filePath)
        if (!parameter) break
        parameters.push(parameter)
      }
      const rule: Rule = new RuleClass(this, cache.command, cache.phase, options, parameters)
      this.addNode(rule.id)
      await rule.initialize()
      this.rules.set(rule.id, rule)
      await rule.getInputs(cache.inputs)
      const outputs: File[] = await rule.getOutputs(cache.outputs)
      if (RuleClass.alwaysEvaluate || outputs.length !== cache.outputs.length) {
        // At least one of the outputs is missing or the rule should always run.
        rule.addActions()
      }
      for (const input of rule.inputs) {
        await rule.addFileActions(input)
      }
    }
  }

  getRuleId (name: string, command: Command, phase: Phase, jobName: string | undefined, parameters: string[] = []): string {
    const items: string[] = [command, phase, jobName || ''].concat(parameters)
    return `${name}(${items.join(';')})`
  }

  getRule (name: string, command: Command, phase: Phase, jobName: string | undefined, parameters: string[] = []): Rule | undefined {
    const id: string = this.getRuleId(name, command, phase, jobName, parameters)
    return this.rules.get(id)
  }

  addNode (x: string): void {
    this.graph.setNode(x)
    this.graphProperties = {}
  }

  removeNode (x: string): void {
    this.graph.removeNode(x)
    this.graphProperties = {}
  }

  hasEdge (x: string, y: string): boolean {
    return this.graph.hasEdge(x, y)
  }

  addEdge (x: string, y: string): void {
    this.graph.setEdge(x, y)
    this.graphProperties = {}
  }

  removeEdge (x: string, y: string): void {
    this.graph.removeEdge(x, y)
    this.graphProperties = {}
  }

  async getFile (filePath: string, fileCache?: FileCache): Promise<File | undefined> {
    filePath = this.normalizePath(filePath)
    let file: File | undefined = this.files.get(filePath)

    if (!file) {
      file = await File.create(path.resolve(this.rootPath, filePath), filePath, fileCache)
      if (!file) {
        this.graph.removeNode(filePath)
        this.emit('fileRemoved', {
          type: 'fileRemoved',
          file: filePath
        })
        return
      }
      this.addNode(filePath)
      this.emit('fileAdded', {
        type: 'fileAdded',
        file: filePath,
        virtual: file.virtual
      })
      this.files.set(filePath, file)
    }

    return file
  }

  async deleteFile (file: File, jobName: string | undefined, unlink: boolean = true) {
    const invalidRules: Rule[] = []

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
      this.removeNode(rule.id)
    }

    if (jobName) file.jobNames.delete(jobName)
    if (file.jobNames.size === 0) {
      if (unlink) {
        await file.delete()
        this.emit('fileDeleted', {
          type: 'fileDeleted',
          file: file.filePath,
          virtual: file.virtual
        })
      }
      this.removeNode(file.filePath)
      this.files.delete(file.filePath)
    }
  }

  assignSubOptions (to: {[name: string]: any}, from: {[name: string]: any}) {
    for (const name in from) {
      if (from.hasOwnProperty(name)) {
        const value: any = from[name]
        if (typeof value !== 'object' || Array.isArray(value)) {
          const schema: Option | void = this.optionSchema.get(name)
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

  getJobOptions (jobName: string | null = null): OptionsInterface {
    let optionProxy: OptionsInterface | undefined = this.optionProxies.get(jobName)

    if (!optionProxy) {
      optionProxy = <OptionsInterface>new Proxy(this.options, {
        get: (target, name) => {
          if (name === 'jobNames') {
            if ('jobName' in target) return [target.jobName]
            if ('jobNames' in target) return target.jobNames
            if ('jobs' in target) return Object.keys(target.jobs)
            return [null]
          }

          if (jobName) {
            if (name === 'jobName') return jobName
            if ('jobs' in target) {
              const jobOptions: OptionInterfaceMap = target.jobs[jobName]
              if (jobOptions && name in jobOptions) return jobOptions[name]
            }
          }

          const schema: Option | void = this.optionSchema.get(name.toString())

          if (schema && schema.type === 'boolean') {
            return !!target[name]
          }

          return (name === 'filePath') ? this.filePath : target[name]
        },
        ownKeys: target => {
          const keys: Set<string> = new Set<string>(['filePath', 'jobNames'])

          if (jobName && 'jobs' in target) {
            const jobOptions: OptionInterfaceMap = target.jobs[jobName]
            if (jobOptions) Object.keys(jobOptions).forEach(key => keys.add(key))
          }

          this.optionSchema.forEach(option => {
            if (option.type === 'boolean') keys.add(option.name)
          })

          Object.keys(target).forEach(key => keys.add(key))

          keys.delete('jobs')

          return Array.from(keys.values())
        }
      })

      this.optionProxies.set(jobName, optionProxy)
    }

    return optionProxy
  }

  get components (): Rule[][] {
    if (!this.graphProperties.components) {
      this.graphProperties.components = alg.components(this.graph)
        .map(component => <Rule[]>component.map(id => this.rules.get(id)).filter(rule => rule))
        .filter(component => component.length > 0)
    }

    return this.graphProperties.components
  }

  isGrandparentOf (x: File | Rule, y: File | Rule): boolean {
    const xLabel: string = getLabel(x)
    const yLabel: string = getLabel(y)
    const predecessors: string[] = this.graph.predecessors(yLabel) || []

    return predecessors.some(file => (this.graph.predecessors(file) || []).some(r => r === xLabel))
  }

  getInputRules (file: File): Rule[] {
    const successors = this.graph.successors(file.filePath) || []
    return <Rule[]>successors.map(id => this.rules.get(id)).filter(rule => rule)
  }

  getOutputRules (file: File): Rule[] {
    const predecessors = this.graph.predecessors(file.filePath) || []
    return <Rule[]>predecessors.map(id => this.rules.get(id)).filter(rule => rule)
  }

  isOutputOf (file: File, ruleId: string): boolean {
    const inEdges = this.graph.inEdges(file.filePath) || []

    return inEdges.some(edge => edge.v.startsWith(ruleId))
  }
}
