import * as fs from 'fs-extra'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { EventEmitter } from 'events'

import { Command, LogEvent, OptionDefinition } from './types'

export async function getOptionDefinitions (): Promise<OptionDefinition[]> {
  const filePath = path.resolve(__dirname, '..', 'resources', 'option-schema.yaml')
  const contents = await fs.readFile(filePath, { encoding: 'utf-8' })
  const schema: any = yaml.safeLoad(contents)
  const options: OptionDefinition[] = []
  for (const name in schema) {
    const option: OptionDefinition = schema[name]
    option.name = name
    options.push(option)
  }
  return options
}

export interface Builder extends EventEmitter {
  getTargetPaths (absolute?: boolean): Promise<string[]>
  kill (message?: string): Promise<void>
  resolvePath (filePath: string): string
  run (...commands: Command[]): Promise<boolean>

  setInstanceOptions (options: object, merge: boolean | undefined): Promise<void>
  setUserOptions (options: object, merge: boolean | undefined): Promise<void>
  setDirectoryOptions (options: object, merge: boolean | undefined): Promise<void>
  setProjectOptions (options: object, merge: boolean | undefined): Promise<void>

  on (event: 'log', listener: (event: LogEvent) => void): this
  on (event: string | symbol, listener: (...args: any[]) => void): this

  once (event: 'log', listener: (event: LogEvent) => void): this
  once (event: string | symbol, listener: (...args: any[]) => void): this

  prependListener (event: 'log', listener: (event: LogEvent) => void): this
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this

  prependOnceListener (event: 'log', listener: (event: LogEvent) => void): this
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this

  removeListener (event: 'log', listener: (event: LogEvent) => void): this
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this
}

export interface BuilderManager extends EventEmitter {
  getTargetPaths (filePath: string, absolute?: boolean): Promise<string[]>
  clear (filePath?: string): Promise<void>
  kill (filePath?: string): Promise<void>
  setInstanceOptions (filePath: string, options: object, merge?: boolean): Promise<boolean>
  setUserOptions (filePath: string, options: object, merge?: boolean): Promise<boolean>
  setDirectoryOptions (filePath: string, options: object, merge?: boolean): Promise<boolean>
  setProjectOptions (filePath: string, options: object, merge?: boolean): Promise<boolean>
  run (filePath: string, commands: Command[]): Promise<boolean>

  on (event: 'log', listener: (filePath: string, event: LogEvent) => void): this
  on (event: string | symbol, listener: (...args: any[]) => void): this

  once (event: 'log', listener: (filePath: string, event: LogEvent) => void): this
  once (event: string | symbol, listener: (...args: any[]) => void): this

  prependListener (event: 'log', listener: (filePath: string, event: LogEvent) => void): this
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this

  prependOnceListener (event: 'log', listener: (filePath: string, event: LogEvent) => void): this
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this

  removeListener (event: 'log', listener: (filePath: string, event: LogEvent) => void): this
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this
}
