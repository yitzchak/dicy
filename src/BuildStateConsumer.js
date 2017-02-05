/* @flow */

import path from 'path'

import BuildState from './BuildState'
import File from './File'
import Rule from './Rule'

import type { Command, Message, Phase, ResolvePathOptions } from './types'

export default class BuildStateConsumer {
  buildState: BuildState
  options: Object
  jobName: ?string

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

  get phase (): Phase {
    return this.buildState.phase
  }

  set phase (value: Phase) {
    this.buildState.phase = value
  }

  get command (): Command {
    return this.buildState.command
  }

  set command (value: Command) {
    this.buildState.command = value
  }

  async addRule (rule: Rule): Promise<void> {
    await this.buildState.addRule(rule)
  }

  normalizePath (filePath: string) {
    return this.buildState.normalizePath(filePath)
  }

  resolvePath (ext: string, { absolute = false, useJobName = true, useOutputDirectory = true }: ResolvePathOptions = {}) {
    let { dir, name } = path.parse(this.filePath)

    if (useJobName) name = this.jobName || this.options.jobName || name

    const outputDirectory = this.options.outputDirectory
    if (useOutputDirectory && outputDirectory) {
      dir = path.join(dir, outputDirectory)
    }

    if (absolute) {
      dir = path.resolve(this.rootPath, dir)
    }

    return path.format({ dir, name, ext })
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

  async getResolvedFile (ext: string, options: ResolvePathOptions = {}): Promise<?File> {
    const filePath = this.resolvePath(ext, options)
    return await this.getFile(filePath)
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
