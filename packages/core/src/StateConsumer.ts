import * as _ from 'lodash'
import { EventEmitter } from 'events'
import * as childProcess from 'child_process'
import * as kill from 'tree-kill'
import fastGlob from 'fast-glob'
import * as path from 'path'

import {
  Command,
  Message,
  OptionDefinition,
  OptionsInterface,
  Severity
} from '@dicy/types'

import State from './State'
import File from './File'
import Rule from './Rule'
import {
  FileCache,
  GlobOptions,
  KillToken,
  Phase,
  ProcessResults,
  RuleCache
} from './types'

const VARIABLE_PATTERN: RegExp = /\$\{?(\w+)\}?/g

export default class StateConsumer implements EventEmitter {
  readonly state: State
  readonly options: OptionsInterface
  readonly jobName: string | undefined
  readonly env: { [name: string]: string }

  private readonly localOptions: { [name: string]: any } = {}

  constructor (state: State, options: OptionsInterface, hasLocalOptions: boolean = false) {
    this.state = state
    this.options = hasLocalOptions
      ? new Proxy(options, {
        get: (target: OptionsInterface, key: PropertyKey): any => {
          return key in this.localOptions
            ? this.localOptions[key]
            : target[key]
        },
        set: (target: OptionsInterface, key: PropertyKey, value: any) => {
          this.setOption(this.localOptions, key.toString(), value)
          return true
        },
        ownKeys: (target: OptionsInterface): string[] => {
          const keys: Set<string> = new Set(Object.keys(this.localOptions))

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
    const resolvedOldFilePath: string = this.resolvePath(oldFilePath)
    if (this.state.targets.has(resolvedOldFilePath)) {
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

  getTargetPaths (absolute: boolean = false): Promise<string[]> {
    return this.state.getTargetPaths(absolute)
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
      const value: any = options[name]

      if (name === 'jobs') {
        let jobs = store.jobs

        if (!jobs) {
          store.jobs = jobs = {}
        }

        for (const jobName in value) {
          const subOptions: any = value[jobName]
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

  getOptionSchema (name: string): OptionDefinition | undefined {
    return this.state.optionSchema.get(name)
  }

  setOption (store: any, name: string, value: any) {
    const schema: OptionDefinition | undefined = this.state.optionSchema.get(name)
    if (schema) {
      let invalidType: boolean = false

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

  async deleteFile (file: File, jobName: string | undefined, unlink: boolean = true): Promise<void> {
    if (file.readOnly) return

    const invalidRules: Rule[] = []

    for (const rule of this.rules) {
      if (rule.jobName === jobName) {
        if (await rule.removeFileFromRule(file)) {
          // This file is one of the parameters of the rule so we need to remove
          // the rule.
          invalidRules.push(rule)
        }
      }
    }

    for (const rule of invalidRules) {
      this.removeRule(rule)
    }

    if (jobName) file.jobNames.delete(jobName)
    if (file.jobNames.size === 0) {
      if (unlink) {
        await file.delete()
        if (!file.virtual) this.info(`Deleting \`${file.filePath}\``, 'file')
      }
      this.removeFile(file)
    }
  }

  addRule (rule: Rule): Promise<void> {
    return this.state.addRule(rule)
  }

  removeRule (rule: Rule): void {
    this.state.removeRule(rule)
  }

  removeFile (file: File): void {
    this.state.removeFile(file)
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
    const properties: any = Object.assign({}, this.state.env, this.env, additionalProperties)

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
      const file: File | undefined = await this.getFile(filePath)
      if (file) files.push(file)
    }
    return files
  }

  async getGlobbedFiles (pattern: string): Promise<File[]> {
    const files: File[] = []
    for (const filePath of await this.globPath(pattern)) {
      const file: File | undefined = await this.getFile(filePath)
      if (file) files.push(file)
    }
    return files
  }

  error (text: string, category?: string, name: string = 'DiCy'): void {
    this.log(_.pickBy({ severity: 'error', category, name, text }) as Message)
  }

  warning (text: string, category?: string, name: string = 'DiCy'): void {
    this.log(_.pickBy({ severity: 'warning', category, name, text }) as Message)
  }

  info (text: string, category?: string, name: string = 'DiCy'): void {
    this.log(_.pickBy({ severity: 'info', category, name, text }) as Message)
  }

  trace (text: string, category?: string, name: string = 'DiCy'): void {
    this.log(_.pickBy({ severity: 'trace', category, name, text }) as Message)
  }

  log (...messages: Message[]): void {
    const severity: Severity = this.options.severity || 'warning'
    const logCategory: string | undefined = this.options.logCategory

    messages = messages.filter(message => severity === 'trace' ||
      (severity === 'info' && message.severity !== 'trace') ||
      (severity === 'warning' && (message.severity === 'warning' || message.severity === 'error')) ||
      (severity === 'error' && message.severity === 'error') ||
      (logCategory && message.category === logCategory))

    if (messages.length > 0) {
      this.emit('log', messages)
    }
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
  addListener (event: 'log', listener: (messages: Message[]) => void): this
  addListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.addListener(event, listener)
    return this
  }

  emit (event: 'log', messages: Message[]): boolean
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

  on (event: 'log', listener: (messages: Message[]) => void): this
  on (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.on(event, listener)
    return this
  }

  once (event: 'log', listener: (messages: Message[]) => void): this
  once (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.once(event, listener)
    return this
  }

  prependListener (event: 'log', listener: (messages: Message[]) => void): this
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.prependListener(event, listener)
    return this
  }

  prependOnceListener (event: 'log', listener: (messages: Message[]) => void): this
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.prependOnceListener(event, listener)
    return this
  }

  removeAllListeners (event: string | symbol): this {
    this.state.removeAllListeners(event)
    return this
  }

  removeListener (event: 'log', listener: (messages: Message[]) => void): this
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this {
    this.state.removeListener(event, listener)
    return this
  }

  setMaxListeners (n: number): this {
    this.state.setMaxListeners(n)
    return this
  }

  /**
   * Kill all child processes.
   */
  killChildProcesses (): void {
    for (const pid of this.state.processes.values()) {
      kill(pid)
    }
    this.state.processes.clear()
  }

  /**
   * Execute a child process
   * @param  {string}                  command The command line. Should be quoted.
   * @param  {object}                  options Options passed to spawn.
   * @return {Promise<ProcessResults>}         Result of process including output.
   */
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
        let error: any
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
    return this.state.getInputFiles(rule)
  }

  getOutputFiles (rule: Rule): File[] {
    return this.state.getOutputFiles(rule)
  }

  getRuleId (name: string, command: Command, phase: Phase, jobName: string | null = null, parameters: string[] = []): string {
    return this.state.getRuleId(name, command, phase, jobName, parameters)
  }

  addCachedRule (cache: RuleCache): Promise<void> {
    return this.state.addCachedRule(cache)
  }

  async addCachedFile (filePath: string, fileCache: FileCache): Promise<void> {
    await this.state.getFile(filePath, fileCache)
  }
}
