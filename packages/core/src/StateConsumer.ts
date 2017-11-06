import * as _ from 'lodash'
import { EventEmitter } from 'events'
import * as childProcess from 'child_process'
import * as kill from 'tree-kill'
import fastGlob from 'fast-glob'
import * as path from 'path'

import State from './State'
import File from './File'
import Rule from './Rule'
import {
  RuleCache,
  Command,
  FileCache,
  GlobOptions,
  KillToken,
  Message,
  Option,
  OptionsInterface,
  Phase,
  ProcessResults
} from './types'

const VARIABLE_PATTERN = /\$\{?(\w+)\}?/g

export default class StateConsumer implements EventEmitter {
  state: State
  options: OptionsInterface
  privateOptions: {[name: string]: any} = {}
  jobName: string | undefined
  env: { [name: string]: string }

  constructor (state: State, options: OptionsInterface, hasPrivateOptions: boolean = false) {
    this.state = state
    this.options = hasPrivateOptions
      ? new Proxy(options, {
        get: (target, key) => {
          return key in this.privateOptions
            ? this.privateOptions[key]
            : target[key]
        },
        set: (target, key, value) => {
          this.setOption(this.privateOptions, key.toString(), value)
          return true
        },
        ownKeys: target => {
          const keys = new Set(Object.keys(this.privateOptions))

          Object.keys(target).forEach(key => keys.add(key))

          return Array.from(keys.values())
        }
      })
      : options
    this.env = {
      OUTDIR: this.options.outputDirectory || '.',
      OUTEXT: `.${this.options.outputFormat}`,
      JOB: this.options.jobName || this.state.env.NAME
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
      this.addResolvedTarget(newFilePath)
    }
  }

  addResolvedTargets (filePaths: string[]) {
    for (const filePath of filePaths) {
      this.addResolvedTarget(filePath)
    }
  }

  get targets (): string[] {
    return Array.from(this.state.targets)
  }

  getTargetPaths (): Promise<string[]> {
    return this.state.getTargetPaths()
  }

  getTargetFiles (): Promise<File[]> {
    return this.state.getTargetFiles()
  }

  get killToken (): KillToken | null {
    return this.state.killToken
  }

  set killToken (value: KillToken | null) {
    this.state.killToken = value
  }

  get cacheTimeStamp (): Date {
    return this.state.cacheTimeStamp
  }

  set cacheTimeStamp (timeStamp: Date) {
    this.state.cacheTimeStamp = timeStamp
  }

  get serializedOptions (): object {
    return _.cloneDeep(this.state.options)
  }

  resetOptions () {
    this.state.resetOptions()
  }

  assignOptions (options: any, store?: any) {
    if (!store) store = this.state.options

    for (const name in options) {
      const value = options[name]

      if (name === 'jobs') {
        let jobs = store.jobs

        if (!jobs) {
          store.jobs = jobs = {}
        }

        for (const jobName in value) {
          const subOptions = value[jobName]
          let jobOptions = jobs[jobName]

          if (!jobOptions) {
            jobs[jobName] = jobOptions = {}
          }

          for (const jobOptionName in subOptions) {
            this.setOption(jobOptions, jobOptionName, subOptions[jobOptionName])
          }
        }
      } else {
        this.setOption(store, name, value)
      }
    }
  }

  getOptionSchema (name: string): Option | undefined {
    return this.state.optionSchema.get(name)
  }

  setOption (store: any, name: string, value: any) {
    const schema: Option | undefined = this.state.optionSchema.get(name)
    if (schema) {
      let invalidType = false

      switch (schema.type) {
        case 'string':
          invalidType = typeof value !== 'string'
          break
        case 'strings':
          invalidType = !Array.isArray(value) || value.some(x => typeof x !== 'string')
          break
        case 'number':
          invalidType = typeof value !== 'number'
          break
        case 'boolean':
          invalidType = typeof value !== 'boolean'
          break
        case 'variable':
          invalidType = !(typeof value === 'string' ||
            (Array.isArray(value) && value.every(x => typeof x === 'string')))
          break
      }

      if (invalidType || (schema.values && !schema.values.includes(value))) {
        this.warning(`Ignoring attempt to set \`${name}\` to a invalid value of \`${value.toString()}\``)
      } else {
        store[schema.name] = value
      }
    } else if (name.startsWith('$')) {
      // It's an environment variable
      store[name] = value
    } else {
      this.warning(`Ignoring attempt to set unknown option \`${name}\` to a value of \`${value.toString()}\``)
    }
  }

  checkForKill (): void {
    if (this.state.killToken && this.state.killToken.error) throw this.state.killToken.error
  }

  get ruleClasses (): typeof Rule[] {
    return this.state.ruleClasses
  }

  set ruleClasses (rules: typeof Rule[]) {
    this.state.ruleClasses = rules
  }

  get filePath (): string {
    return this.state.filePath
  }

  get rootPath (): string {
    return this.state.rootPath
  }

  get files (): IterableIterator<File> {
    return this.state.files.values()
  }

  get rules (): IterableIterator<Rule> {
    return this.state.rules.values()
  }

  deleteFile (file: File, jobName: string | undefined, unlink: boolean = true): Promise<void> {
    return this.state.deleteFile(file, jobName, unlink)
  }

  addRule (rule: Rule): Promise<void> {
    return this.state.addRule(rule)
  }

  removeRule (rule: Rule): void {
    this.state.removeRule(rule)
  }

  hasRule (id: string): boolean {
    return this.state.rules.has(id)
  }

  normalizePath (filePath: string) {
    return this.state.normalizePath(filePath)
  }

  resolvePath (filePath: string): string {
    return path.normalize(this.expandVariables(filePath))
  }

  expandVariables (value: string, additionalProperties: any = {}): string {
    const properties = Object.assign({}, this.state.env, this.env, additionalProperties)

    return value.replace(VARIABLE_PATTERN, (match, name) => properties[name] || match[0])
  }

  async globPath (pattern: string, { types = 'all', ignorePattern }: GlobOptions = {}): Promise<string[]> {
    try {
      return await fastGlob(this.expandVariables(pattern), {
        cwd: this.rootPath,
        bashNative: [],
        onlyFiles: types === 'files',
        onlyDirs: types === 'directories',
        ignore: ignorePattern
      }) as string[]
    } catch (error) {
      this.error(error.toString())
    }

    return []
  }

  async getFile (filePath: string): Promise<File | undefined> {
    const file: File | undefined = await this.state.getFile(filePath)
    if (file && this.options.jobName) file.jobNames.add(this.options.jobName)
    return file
  }

  async getFiles (filePaths: string[]): Promise<File[]> {
    const files: File[] = []
    for (const filePath of filePaths) {
      const file = await this.getFile(filePath)
      if (file) files.push(file)
    }
    return files
  }

  async getGlobbedFiles (pattern: string): Promise<File[]> {
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

  get components (): Rule[][] {
    return this.state.components
  }

  hasInput (rule: Rule, file: File): boolean {
    return this.state.hasEdge(file.filePath, rule.id)
  }

  hasOutput (rule: Rule, file: File): boolean {
    return this.state.hasEdge(rule.id, file.filePath)
  }

  addInput (rule: Rule, file: File): void {
    this.state.addEdge(file.filePath, rule.id)
  }

  addOutput (rule: Rule, file: File): void {
    this.state.addEdge(rule.id, file.filePath)
  }

  removeInput (rule: Rule, file: File): void {
    this.state.removeEdge(file.filePath, rule.id)
  }

  removeOutput (rule: Rule, file: File): void {
    this.state.removeEdge(rule.id, file.filePath)
  }

  isGrandparentOf (x: File | Rule, y: File | Rule): boolean {
    return this.state.isGrandparentOf(x, y)
  }

  async getResolvedFile (filePath: string): Promise<File | undefined> {
    return this.getFile(this.resolvePath(filePath))
  }

  // EventEmmitter proxy
  addListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.addListener(event, listener)
    return this
  }

  emit (event: string | symbol, ...args: any[]): boolean {
    return this.state.emit(event, ...args)
  }

  eventNames (): (string | symbol)[] {
    return this.state.eventNames()
  }

  getMaxListeners (): number {
    return this.state.getMaxListeners()
  }

  listenerCount (event: string | symbol) {
    return this.state.listenerCount(event)
  }

  listeners (event: string | symbol) {
    return this.state.listeners(event)
  }

  on (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.on(event, listener)
    return this
  }

  once (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.once(event, listener)
    return this
  }

  prependListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.prependListener(event, listener)
    return this
  }

  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.prependOnceListener(event, listener)
    return this
  }

  removeAllListeners (event: string | symbol): this {
    this.state.removeAllListeners(event)
    return this
  }

  removeListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.removeListener(event, listener)
    return this
  }

  setMaxListeners (n: number): this {
    this.state.setMaxListeners(n)
    return this
  }

  executeChildProcess (command: string, options: object): Promise<ProcessResults> {
    return new Promise((resolve, reject) => {
      let stdout: string
      let stderr: string
      let exited: boolean = false
      const child = childProcess.spawn(command, options)
      const handleExit = (error: any): void => {
        if (exited) return
        exited = true

        if (child.pid) this.state.processes.delete(child.pid)
        if (error) {
          reject(error)
        } else {
          resolve({ stdout, stderr })
        }
      }

      if (child.pid) this.state.processes.add(child.pid)
      child.on('error', handleExit)
      child.on('close', (code: any, signal: any) => {
        let error
        if (code !== 0 || signal !== null) {
          error = new Error(`Command failed: \`${command}\`\n${stderr || ''}`.trim()) as any
          error.code = code
          error.signal = signal
        }
        handleExit(error)
      })
      if (child.stdout) {
        child.stdout.setEncoding('utf8')
        child.stdout.on('data', (data: string) => { stdout = `${stdout || ''}${data}` })
      }
      if (child.stderr) {
        child.stderr.setEncoding('utf8')
        child.stderr.on('data', (data: string) => { stderr = `${stderr || ''}${data}` })
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

  getJobOptions (jobName: string | null = null): OptionsInterface {
    return this.state.getJobOptions(jobName)
  }

  getInputRules (file: File): Rule[] {
    return this.state.getInputRules(file)
  }

  getOutputRules (file: File): Rule[] {
    return this.state.getOutputRules(file)
  }

  getInputFiles (rule: Rule): File[] {
    return this.state.getInputs(rule)
  }

  getOutputFiles (rule: Rule): File[] {
    return this.state.getOutputs(rule)
  }

  getRuleId (name: string, command: Command, phase: Phase, jobName: string | undefined, parameters: string[] = []): string {
    return this.state.getRuleId(name, command, phase, jobName, parameters)
  }

  addCachedRule (cache: RuleCache): Promise<void> {
    return this.state.addCachedRule(cache)
  }

  async addCachedFile (filePath: string, fileCache: FileCache): Promise<void> {
    await this.state.getFile(filePath, fileCache)
  }
}
