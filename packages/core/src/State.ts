import { alg, Graph } from 'graphlib'
import { EventEmitter } from 'events'
const fileUrl = require('file-url')
import * as path from 'path'

import { Command, OptionDefinition, OptionsInterface } from '@dicy/types'

import File from './File'
import Rule from './Rule'
import {
  FileCache,
  KillToken,
  OptionInterfaceMap,
  Phase,
  RuleCache
} from './types'

function getLabel (x: File | Rule): string {
  return (x instanceof File) ? x.filePath : x.id
}

type GraphProperties = {
  components?: Rule[][]
}

export default class State extends EventEmitter {
  readonly filePath: string
  readonly rootPath: string
  files: Map<string, File> = new Map()
  rules: Map<string, Rule> = new Map()
  options: {[name: string]: any} = {}
  defaultOptions: OptionsInterface
  optionSchema: Map<string, OptionDefinition> = new Map()
  ruleClasses: typeof Rule[] = []
  cacheTimeStamp: Date
  processes: Set<number> = new Set<number>()
  env: {[name: string]: string}
  targets: Set<string> = new Set<string>()
  killToken: KillToken | null

  private graph: Graph = new Graph()
  private graphProperties: GraphProperties = {}
  private optionProxies: Map<string | null, OptionsInterface> = new Map<string | null, OptionsInterface>()

  constructor (filePath: string, schema: OptionDefinition[] = []) {
    super()
    const resolveFilePath: string = path.resolve(filePath)
    const { dir, base, name, ext } = path.parse(resolveFilePath)
    this.filePath = base
    this.rootPath = dir,
    this.defaultOptions = {} as OptionsInterface
    for (const option of schema) {
      this.optionSchema.set(option.name, option)
      for (const alias of option.aliases || []) {
        this.optionSchema.set(alias, option)
      }
      if (option.defaultValue) this.defaultOptions[option.name] = option.defaultValue
    }
    this.resetOptions()

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

  async getTargets (): Promise<string[]> {
    const results: string[] = []
    for (const target of this.targets.values()) {
      const file: File | undefined = await this.getFile(target)
      if (file) results.push(fileUrl(file.realFilePath))
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

  removeRule (rule: Rule): void {
    this.rules.delete(rule.id)
    this.removeNode(rule.id)
  }

  removeFile (file: File): void {
    this.files.delete(file.filePath)
    this.removeNode(file.filePath)
  }

  getRuleId (name: string, command: Command, phase: Phase, jobName: string | null = null, parameters: string[] = []): string {
    const items: string[] = [command, phase, jobName || ''].concat(parameters)
    return `${name}(${items.join(';')})`
  }

  getRule (name: string, command: Command, phase: Phase, jobName: string | null = null, parameters: string[] = []): Rule | undefined {
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
        return undefined
      }
      this.addNode(filePath)
      this.files.set(filePath, file)
    }

    return file
  }

  resetOptions (): void {
    for (const name of Object.getOwnPropertyNames(this.options)) {
      delete this.options[name]
    }

    Object.assign(this.options, this.defaultOptions)
  }

  getJobOptions (jobName: string | null = null): OptionsInterface {
    let optionProxy: OptionsInterface | undefined = this.optionProxies.get(jobName)

    if (!optionProxy) {
      optionProxy = new Proxy(this.options, {
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

          const schema: OptionDefinition | void = this.optionSchema.get(name.toString())

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
      }) as OptionsInterface

      this.optionProxies.set(jobName, optionProxy)
    }

    return optionProxy
  }

  get components (): Rule[][] {
    if (!this.graphProperties.components) {
      this.graphProperties.components = alg.components(this.graph)
        .map(component => component.map(id => this.rules.get(id)).filter(rule => rule) as Rule[])
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
    return successors.map(id => this.rules.get(id)).filter(rule => rule) as Rule[]
  }

  getOutputRules (file: File): Rule[] {
    const predecessors = this.graph.predecessors(file.filePath) || []
    return predecessors.map(id => this.rules.get(id)).filter(rule => rule) as Rule[]
  }

  isOutputOf (file: File, ruleId: string): boolean {
    const inEdges = this.graph.inEdges(file.filePath) || []

    return inEdges.some(edge => edge.v.startsWith(ruleId))
  }

  getInputFiles (rule: Rule): File[] {
    const predecessors = this.graph.predecessors(rule.id) || []
    return predecessors.map(filePath => this.files.get(filePath)).filter(file => file) as File[]
  }

  getOutputFiles (rule: Rule): File[] {
    const successors = this.graph.successors(rule.id) || []
    return successors.map(filePath => this.files.get(filePath)).filter(file => file) as File[]
  }
}
