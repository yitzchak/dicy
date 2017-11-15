/// <reference types="node" />
import { EventEmitter } from 'events';
import { BuilderInterface, BuilderCacheInterface, Command, LogEvent } from '@dicy/types';

export * from '@dicy/types';

export class DiCy extends EventEmitter implements BuilderCacheInterface {
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
