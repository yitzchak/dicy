import * as childProcess from 'child_process'
import * as kill from 'tree-kill'
import fastGlob from 'fast-glob'
import * as path from 'path'

import State from './State'
import File from './File'
import Rule from './Rule'

import {
  GlobOptions,
  KillToken,
  Message,
  OptionsInterface,
  ProcessResults
} from './types'

const VARIABLE_PATTERN = /\$\{?(\w+)\}?/g

export default class StateConsumer {
  state: State
  options: OptionsInterface
  consumerOptions: {[name: string]: any} = {}
  jobName: string | undefined
  env: { [name: string]: string }

  constructor (state: State, options: OptionsInterface) {
    this.state = state
    this.options = new Proxy(options, {
      get: (target, key) => {
        return key in this.consumerOptions
          ? this.consumerOptions[key]
          : target[key]
      },
      set: (target, key, value) => {
        this.setOption(this.consumerOptions, key.toString(), value)
        return true
      },
      ownKeys: target => {
        const keys = new Set(Object.keys(this.consumerOptions))

        Object.keys(target).forEach(key => keys.add(key))

        return Array.from(keys.values())
      }
    })
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

  get killToken (): KillToken | null {
    return this.state.killToken
  }

  set killToken (value: KillToken | null) {
    this.state.killToken = value
  }

  assignOptions (options: any) {
    for (const name in options) {
      const value = options[name]

      if (name === 'jobs') {
        let jobs = this.state.options.jobs

        if (!jobs) {
          this.state.options.jobs = jobs = {}
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
        this.setOption(this.state.options, name, value)
      }
    }
  }

  setOption (store: any, name: string, value: any) {
    const schema = this.state.optionSchema.get(name)
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

  get targets (): string[] {
    const targets: Set<string> = new Set<string>()

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

  getTargetPaths (): Promise<string[]> {
    return this.state.getTargetPaths()
  }

  getTargetFiles (): Promise<File[]> {
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

  isGrandparentOf (x: File | Rule, y: File | Rule): boolean {
    return this.state.isGrandparentOf(x, y)
  }

  async getResolvedFile (filePath: string): Promise<File | undefined> {
    return this.getFile(this.resolvePath(filePath))
  }

  // EventEmmitter proxy
  addListener (eventName: string, listener: (...args: any[]) => void) {
    return this.state.addListener(eventName, listener)
  }

  emit (eventName: string, ...args: any[]) {
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

  on (eventName: string, listener: (...args: any[]) => void) {
    return this.state.on(eventName, listener)
  }

  once (eventName: string, listener: (...args: any[]) => void) {
    return this.state.once(eventName, listener)
  }

  prependListener (eventName: string, listener: (...args: any[]) => void) {
    return this.state.prependListener(eventName, listener)
  }

  prependOnceListener (eventName: string, listener: (...args: any[]) => void) {
    return this.state.prependOnceListener(eventName, listener)
  }

  removeAllListeners (eventName: string) {
    return this.state.removeAllListeners(eventName)
  }

  removeListener (eventName: string, listener: (...args: any[]) => void) {
    return this.state.removeListener(eventName, listener)
  }

  setMaxListeners (n: number) {
    return this.state.setMaxListeners(n)
  }

  executeChildProcess (command: string, options: Object): Promise<ProcessResults> {
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
}
