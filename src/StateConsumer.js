/* @flow */

import childProcess from 'child_process'
import kill from 'tree-kill'
import fastGlob from 'fast-glob'
import path from 'path'

import State from './State'
import File from './File'
import Rule from './Rule'

import type { globOptions, Message } from './types'

const VARIABLE_PATTERN = /\$\{?(\w+)\}?/g

export default class StateConsumer {
  state: State
  options: Object
  jobName: ?string

  constructor (state: State, jobName: ?string) {
    this.jobName = jobName
    this.state = state
    this.options = new Proxy(state.options, {
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

  get ruleClasses (): Array<Class<Rule>> {
    return this.state.ruleClasses
  }

  get filePath (): string {
    return this.state.filePath
  }

  get rootPath (): string {
    return this.state.rootPath
  }

  get files (): Iterator<File> {
    return this.state.files.values()
  }

  get rules (): Iterator<Rule> {
    return this.state.rules.values()
  }

  get targets (): Array<string> {
    const targets: Set<string> = new Set()

    for (const rule of this.rules) {
      for (const file of rule.outputs.values()) {
        const ext = path.extname(file.filePath)
        if (ext === `.${this.options.outputFormat}` || (ext === '.xdv' && this.options.outputFormat === 'dvi')) {
          targets.add(file.filePath)
        }
      }
    }

    return Array.from(targets.values())
  }

  async addRule (rule: Rule): Promise<void> {
    await this.state.addRule(rule)
  }

  normalizePath (filePath: string) {
    return this.state.normalizePath(filePath)
  }

  resolvePath (filePath: string, reference?: File | string): string {
    const properties = Object.assign({}, this.state.env, {
      OUTDIR: this.options.outputDirectory || '.',
      OUTEXT: `.${this.options.outputFormat}`,
      JOB: this.jobName || this.options.jobName || this.state.env.NAME
    })

    if (reference) {
      const { dir, base, name, ext } = path.parse(reference instanceof File ? reference.filePath : reference)
      Object.assign(properties, {
        JOB: this.jobName || this.options.jobName || name,
        DIR: (reference instanceof File ? dir : this.rootPath) || '.',
        BASE: base,
        NAME: name,
        EXT: ext
      })
    }

    return path.normalize(filePath.replace(VARIABLE_PATTERN, (match, name) => properties[name]))
  }

  async globPath (pattern: string, reference?: File | string, { types = 'all', ignorePattern }: globOptions = {}): Promise<Array<string>> {
    try {
      return await fastGlob(this.resolvePath(pattern, reference), {
        cwd: this.rootPath,
        bashNative: [],
        onlyFiles: types === 'files',
        onlyDirs: types === 'directories',
        ignore: ignorePattern
      })
    } catch (error) {}

    return []
  }

  async getFile (filePath: string): Promise<?File> {
    const file: ?File = await this.state.getFile(filePath)
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
    this.state.calculateDistances()
  }

  getDistance (x: Rule, y: Rule): ?number {
    return this.state.getDistance(x, y)
  }

  isConnected (x: Rule, y: Rule): boolean {
    return this.state.isConnected(x, y)
  }

  isChild (x: Rule, y: Rule): boolean {
    return this.state.isChild(x, y)
  }

  async getResolvedFile (filePath: string, reference?: File | string): Promise<?File> {
    return await this.getFile(this.resolvePath(filePath, reference))
  }

  // EventEmmitter proxy
  addListener (eventName: string, listener: Function) {
    return this.state.addListener(eventName, listener)
  }

  emit (eventName: string, ...args: Array<any>) {
    return this.state.emit(eventName, ...args)
  }

  eventNames () {
    return this.state.eventNames()
  }

  getMaxListeners () {
    return this.state.eventNames()
  }

  listenerCount (eventName: string) {
    return this.state.listenerCount(eventName)
  }

  listeners (eventName: string) {
    return this.state.listeners(eventName)
  }

  on (eventName: string, listener: Function) {
    return this.state.on(eventName, listener)
  }

  once (eventName: string, listener: Function) {
    return this.state.once(eventName, listener)
  }

  prependListener (eventName: string, listener: Function) {
    return this.state.prependListener(eventName, listener)
  }

  prependOnceListener (eventName: string, listener: Function) {
    return this.state.prependOnceListener(eventName, listener)
  }

  removeAllListeners (eventName: string) {
    return this.state.removeAllListeners(eventName)
  }

  removeListener (eventName: string, listener: Function) {
    return this.state.removeListener(eventName, listener)
  }

  setMaxListeners (n: number) {
    return this.state.setMaxListeners(n)
  }

  executeChildProcess (command: string, options: Object): Promise<Object> {
    return new Promise((resolve, reject) => {
      const { pid } = childProcess.exec(command, options, (error, stdout, stderr) => {
        this.state.processes.delete(pid)
        resolve({ error, stdout, stderr })
      })
      this.state.processes.add(pid)
    })
  }

  killChildProcesses () {
    for (const pid of this.state.processes.values()) {
      kill(pid)
    }
    this.state.processes.clear()
  }
}
