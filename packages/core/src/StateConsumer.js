/* @flow */

import childProcess from 'child_process'
import kill from 'tree-kill'
import fastGlob from 'fast-glob'
import path from 'path'

import State from './State'
import File from './File'
import Rule from './Rule'

import type { globOptions, Message, KillToken } from './types'

const VARIABLE_PATTERN = /\$\{?(\w+)\}?/g

export default class StateConsumer {
  state: State
  options: Object
  consumerOptions: Object = {}
  jobName: ?string
  env: Object

  constructor (state: State, jobName: ?string) {
    this.jobName = jobName
    this.state = state
    // $FlowIgnore
    this.options = new Proxy(this, {
      get: (target, key) => {
        return key in target.consumerOptions
          ? target.consumerOptions[key]
          : target.state.getOption(key, target.jobName)
      },
      set: (target, key, value) => {
        target.consumerOptions[key] = value
        return true
      }
    })
    this.env = {
      OUTDIR: this.options.outputDirectory || '.',
      // $FlowIgnore
      OUTEXT: `.${this.options.outputFormat}`,
      JOB: this.jobName || this.options.jobName || this.state.env.NAME
    }
  }

  addTarget (filePath: string) {
    this.state.targets.add(filePath)
  }

  removeTarget (filePath: string) {
    this.state.targets.delete(filePath)
  }

  addResolvedTarget (filePath: string) {
    this.state.targets.add(this.resolvePath(filePath))
  }

  async replaceResolvedTarget (oldFilePath: string, newFilePath: string) {
    const x = this.resolvePath(oldFilePath)
    if (this.state.targets.has(x)) {
      await this.addResolvedTarget(newFilePath)
    }
  }

  addResolvedTargets (filePaths: Array<string>) {
    for (const filePath of filePaths) {
      this.addResolvedTarget(filePath)
    }
  }

  get killToken (): ?KillToken {
    return this.state.killToken
  }

  set killToken (value: ?KillToken): void {
    this.state.killToken = value
  }

  checkForKill (): void {
    if (this.state.killToken && this.state.killToken.error) throw this.state.killToken.error
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
      for (const file of rule.outputs) {
        const ext = path.extname(file.filePath)
        if (ext === `.${this.options.outputFormat}` || (ext === '.xdv' && this.options.outputFormat === 'dvi')) {
          targets.add(file.filePath)
        }
      }
    }

    return Array.from(targets.values())
  }

  getTargetPaths (): Promise<Array<string>> {
    return this.state.getTargetPaths()
  }

  getTargetFiles (): Promise<Array<File>> {
    return this.state.getTargetFiles()
  }

  async addRule (rule: Rule): Promise<void> {
    await this.state.addRule(rule)
  }

  normalizePath (filePath: string) {
    return this.state.normalizePath(filePath)
  }

  resolvePath (filePath: string): string {
    return path.normalize(this.expandVariables(filePath))
  }

  expandVariables (value: string, additionalProperties: Object = {}): string {
    const properties = Object.assign({}, this.state.env, this.env, additionalProperties)

    return value.replace(VARIABLE_PATTERN, (match, name) => properties[name] || match[0])
  }

  async globPath (pattern: string, { types = 'all', ignorePattern }: globOptions = {}): Promise<Array<string>> {
    try {
      return await fastGlob(this.resolvePath(pattern), {
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

  async getGlobbedFiles (pattern: string): Promise<Array<File>> {
    const files = []
    for (const filePath of await this.globPath(pattern)) {
      const file = await this.getFile(filePath)
      if (file) files.push(file)
    }
    return files
  }

  error (text: string, name: string = 'DiCy') {
    this.log({ severity: 'error', name, text })
  }

  warning (text: string, name: string = 'DiCy') {
    this.log({ severity: 'warning', name, text })
  }

  info (text: string, name: string = 'DiCy') {
    this.log({ severity: 'info', name, text })
  }

  log (message: Message) {
    const severity = this.options.severity || 'warning'
    if ((severity === 'warning' && message.severity === 'info') ||
      (severity === 'error' && message.severity !== 'error')) return
    this.emit('log', { type: 'log', ...message })
  }

  get components (): Array<Array<Rule>> {
    return this.state.components
  }

  addNode (x: string): void {
    this.state.addNode(x)
  }

  removeNode (x: string): void {
    this.state.addNode(x)
  }

  hasEdge (x: string, y: string): boolean {
    return this.state.hasEdge(x, y)
  }

  addEdge (x: string, y: string): void {
    this.state.addEdge(x, y)
  }

  removeEdge (x: string, y: string): void {
    this.state.removeEdge(x, y)
  }

  isChild (x: Rule, y: Rule): boolean {
    return this.state.isChild(x, y)
  }

  async getResolvedFile (filePath: string): Promise<?File> {
    return this.getFile(this.resolvePath(filePath))
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
      let stdout: string
      let stderr: string
      let exited: boolean = false
      const handleExit = error => {
        if (exited) return
        exited = true

        if (child.pid) this.state.processes.delete(child.pid)
        if (error) {
          reject(error)
        } else {
          resolve({ stdout, stderr })
        }
      }
      const child = childProcess.spawn(command, options)

      if (child.pid) this.state.processes.add(child.pid)
      child.on('error', handleExit)
      child.on('close', (code, signal) => {
        let error
        if (code !== 0 || signal !== null) {
          error = new Error(`Command failed: \`${command}\`\n${stderr || ''}`.trim())
          // $FlowIgnore
          error.code = code
          // $FlowIgnore
          error.signal = signal
        }
        handleExit(error)
      })
      if (child.stdout) {
        child.stdout.setEncoding('utf8')
        child.stdout.on('data', data => { stdout = `${stdout || ''}${data}` })
      }
      if (child.stderr) {
        child.stderr.setEncoding('utf8')
        child.stderr.on('data', data => { stderr = `${stderr || ''}${data}` })
      }
    })
  }

  killChildProcesses () {
    for (const pid of this.state.processes.values()) {
      kill(pid)
    }
    this.state.processes.clear()
  }

  isOutputOf (file: File, ruleId: string): boolean {
    return this.state.isOutputOf(file, ruleId)
  }
}
