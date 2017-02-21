/* @flow */

import fastGlob from 'fast-glob'
import placeholders from 'placeholders'
import path from 'path'

import BuildState from './BuildState'
import File from './File'
import Rule from './Rule'

import type { Message } from './types'

export default class BuildStateConsumer {
  buildState: BuildState
  options: Object
  jobName: ?string
  expand: Function

  constructor (buildState: BuildState, jobName: ?string) {
    this.jobName = jobName
    this.buildState = buildState
    this.options = new Proxy(buildState.options, {
      get (target, key) {
        if (key === 'jobNames') {
          if ('jobName' in target) return [target.jobName]
          if ('jobNames' in target) return target.jobNames
          if ('jobs' in target) return Object.keys(target.jobs)
          return [undefined]
        } else if (jobName) {
          if (key === 'jobName') return jobName
          if (target.jobs) {
            const jobOptions = target.jobs[jobName]
            return (jobOptions && key in jobOptions) ? jobOptions[key] : target[key]
          }
        }
        return target[key]
      }
    })

    this.expand = placeholders({ regex: /:(\w+)/ })
  }

  get ruleClasses (): Array<Class<Rule>> {
    return this.buildState.ruleClasses
  }

  get filePath (): string {
    return this.buildState.filePath
  }

  get rootPath (): string {
    return this.buildState.rootPath
  }

  get files (): Iterator<File> {
    return this.buildState.files.values()
  }

  get rules (): Iterator<Rule> {
    return this.buildState.rules.values()
  }

  async addRule (rule: Rule): Promise<void> {
    await this.buildState.addRule(rule)
  }

  normalizePath (filePath: string) {
    return this.buildState.normalizePath(filePath)
  }

  resolvePath (filePath: string, reference?: File | string): string {
    const { dir, base, name, ext } = path.parse(reference instanceof File ? reference.normalizedFilePath : (reference || this.filePath))
    const properties = {
      outdir: this.options.outputDirectory || '.',
      outext: `.${this.options.outputFormat}`,
      job: this.jobName || this.options.jobName || name,
      dir: (reference instanceof File ? dir : this.rootPath) || '.',
      base,
      name,
      ext
    }
    return path.normalize(this.expand(filePath, properties))
  }

  async globPath (pattern: string, reference?: File | string): Promise<Array<string>> {
    return await fastGlob(this.resolvePath(pattern, reference), { cwd: this.rootPath })
  }

  async getFile (filePath: string): Promise<?File> {
    const file: ?File = await this.buildState.getFile(filePath)
    if (file && this.jobName) file.jobNames.add(this.jobName)
    return file
  }

  async getFiles (filePaths: Array<string>): Promise<Array<File>> {
    const files: Array<File> = []
    for (const filePath of filePaths) {
      const file = await this.getFile(filePath)
      if (file) files.push(file)
    }
    return files
  }

  async getGlobbedFiles (pattern: string, reference?: File | string): Promise<Array<File>> {
    const files = []
    for (const filePath of await this.globPath(pattern, reference)) {
      const file = await this.getFile(filePath)
      if (file) files.push(file)
    }
    return files
  }

  error (text: string) {
    this.log({ severity: 'error', text })
  }

  warning (text: string) {
    this.log({ severity: 'warning', text })
  }

  info (text: string) {
    this.log({ severity: 'info', text })
  }

  trace (text: string) {
    this.log({ severity: 'trace', text })
  }

  log (message: Message) {
    const severity = this.options.severity || 'warning'
    if ((severity === 'info' && message.severity === 'trace') ||
      (severity === 'warning' && (message.severity === 'trace' || message.severity === 'info')) ||
      (severity === 'error' && message.severity !== 'error')) return
    this.emit('log', { type: 'log', ...message })
  }

  calculateDistances (): void {
    this.buildState.calculateDistances()
  }

  getDistance (x: Rule, y: Rule): ?number {
    return this.buildState.getDistance(x, y)
  }

  isConnected (x: Rule, y: Rule): boolean {
    return this.buildState.isConnected(x, y)
  }

  isChild (x: Rule, y: Rule): boolean {
    return this.buildState.isChild(x, y)
  }

  async getResolvedFile (filePath: string, reference?: File | string): Promise<?File> {
    return await this.getFile(this.resolvePath(filePath, reference))
  }

  // EventEmmitter proxy
  addListener (eventName: string, listener: Function) {
    return this.buildState.addListener(eventName, listener)
  }

  emit (eventName: string, ...args: Array<any>) {
    return this.buildState.emit(eventName, ...args)
  }

  eventNames () {
    return this.buildState.eventNames()
  }

  getMaxListeners () {
    return this.buildState.eventNames()
  }

  listenerCount (eventName: string) {
    return this.buildState.listenerCount(eventName)
  }

  listeners (eventName: string) {
    return this.buildState.listeners(eventName)
  }

  on (eventName: string, listener: Function) {
    return this.buildState.on(eventName, listener)
  }

  once (eventName: string, listener: Function) {
    return this.buildState.once(eventName, listener)
  }

  prependListener (eventName: string, listener: Function) {
    return this.buildState.prependListener(eventName, listener)
  }

  prependOnceListener (eventName: string, listener: Function) {
    return this.buildState.prependOnceListener(eventName, listener)
  }

  removeAllListeners (eventName: string) {
    return this.buildState.removeAllListeners(eventName)
  }

  removeListener (eventName: string, listener: Function) {
    return this.buildState.removeListener(eventName, listener)
  }

  setMaxListeners (n: number) {
    return this.buildState.setMaxListeners(n)
  }
}
