/// <reference types="node" />
import { EventEmitter } from 'events';
import { Builder, Command, LogEvent } from '@dicy/types';

export * from '@dicy/types';

export class DiCy extends EventEmitter implements Builder {
  static create (filePath: string, options?: object): Promise<DiCy>;
  getTargetPaths (absolute?: boolean): Promise<string[]>;
  kill (message?: string): Promise<void>;
  resolvePath (filePath: string): string;
  run (...commands: Command[]): Promise<boolean>;

  setInstanceOptions (options: object, merge: boolean | undefined): Promise<void>;
  setUserOptions (options: object, merge: boolean | undefined): Promise<void>;
  setDirectoryOptions (options: object, merge: boolean | undefined): Promise<void>;
  setProjectOptions (options: object, merge: boolean | undefined): Promise<void>;

  on (event: 'log', listener: (event: LogEvent) => void): this;
  on (event: string | symbol, listener: (...args: any[]) => void): this;

  once (event: 'log', listener: (event: LogEvent) => void): this;
  once (event: string | symbol, listener: (...args: any[]) => void): this;

  prependListener (event: 'log', listener: (event: LogEvent) => void): this;
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this;

  prependOnceListener (event: 'log', listener: (event: LogEvent) => void): this;
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this;

  removeListener (event: 'log', listener: (event: LogEvent) => void): this;
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this;
}
