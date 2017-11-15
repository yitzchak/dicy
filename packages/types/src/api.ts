import * as fs from 'fs-extra'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { EventEmitter } from 'events'

import { Command, Message, OptionDefinition } from './types'

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

export interface BuilderInterface extends EventEmitter {
  getTargetPaths (absolute?: boolean): Promise<string[]>

  kill (message?: string): Promise<void>
  run (commands: Command[]): Promise<boolean>

  setInstanceOptions (options: object, merge?: boolean): Promise<void>
  setUserOptions (options: object, merge?: boolean): Promise<void>
  setDirectoryOptions (options: object, merge?: boolean): Promise<void>
  setProjectOptions (options: object, merge?: boolean): Promise<void>

  on (event: 'log', listener: (messages: Message[]) => void): this
  on (event: string | symbol, listener: (...args: any[]) => void): this

  once (event: 'log', listener: (messages: Message[]) => void): this
  once (event: string | symbol, listener: (...args: any[]) => void): this

  prependListener (event: 'log', listener: (messages: Message[]) => void): this
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this

  prependOnceListener (event: 'log', listener: (messages: Message[]) => void): this
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this

  removeListener (event: 'log', listener: (messages: Message[]) => void): this
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this
}

export interface BuilderCacheInterface extends EventEmitter {
  get (filePath: string): Promise<BuilderInterface>
  clear (filePath: string): Promise<void>
  clearAll (): Promise<void>
  destroy (): Promise<void>

  getTargetPaths (filePath: string, absolute?: boolean): Promise<string[]>

  kill (filePath: string, message?: string): Promise<void>
  killAll (message?: string): Promise<void>
  run (filePath: string, commands: Command[]): Promise<boolean>

  setInstanceOptions (filePath: string, options: object, merge?: boolean): Promise<void>
  setUserOptions (filePath: string, options: object, merge?: boolean): Promise<void>
  setDirectoryOptions (filePath: string, options: object, merge?: boolean): Promise<void>
  setProjectOptions (filePath: string, options: object, merge?: boolean): Promise<void>

  on (event: 'log', listener: (filePath: string, messages: Message[]) => void): this
  on (event: string | symbol, listener: (...args: any[]) => void): this

  once (event: 'log', listener: (filePath: string, messages: Message[]) => void): this
  once (event: string | symbol, listener: (...args: any[]) => void): this

  prependListener (event: 'log', listener: (filePath: string, messages: Message[]) => void): this
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this

  prependOnceListener (event: 'log', listener: (filePath: string, messages: Message[]) => void): this
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this

  removeListener (event: 'log', listener: (filePath: string, messages: Message[]) => void): this
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this
}
