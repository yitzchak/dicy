import { EventEmitter } from 'events';

export declare type Command = 'build' | 'clean' | 'graph' | 'load' | 'log' | 'save' | 'scrub';

export interface LineRange {
  start: number;
  end: number;
}

export interface Reference {
  file: string;
  range?: LineRange;
}

export declare type Severity = 'info' | 'warning' | 'error';

export interface Message {
  severity: Severity;
  text: string;
  name?: string;
  category?: string;
  source?: Reference;
  log?: Reference;
}

export interface LogEvent {
  type: 'log';
  messages: Message[];
}

export interface Option {
  name: string;
  type: 'string' | 'strings' | 'number' | 'boolean' | 'variable';
  defaultValue?: any;
  description: string;
  values?: any[];
  aliases?: string[];
  commands?: string[];
  noInvalidate?: boolean;
}

export class Client extends EventEmitter {
  constructor (autoStart: boolean);

  start (argv: any): Promise<void>;
  exit (): void;
  getTargetPaths (filePath: string, absolute?: boolean): Promise<string[]>;
  clear (filePath?: string): Promise<void>;
  kill (filePath?: string): Promise<void>;
  run (filePath: string, commands: Command[]): Promise<boolean>;

  setInstanceOptions (options: object, merge: boolean | undefined): Promise<void>;
  setUserOptions (options: object, merge: boolean | undefined): Promise<void>;
  setDirectoryOptions (options: object, merge: boolean | undefined): Promise<void>;
  setProjectOptions (options: object, merge: boolean | undefined): Promise<void>;

  on (event: 'log', listener: (filePath: string, event: LogEvent) => void): this;
  on (event: string | symbol, listener: (...args: any[]) => void): this;

  once (event: 'log', listener: (filePath: string, event: LogEvent) => void): this;
  once (event: string | symbol, listener: (...args: any[]) => void): this;

  prependListener (event: 'log', listener: (filePath: string, event: LogEvent) => void): this;
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this;

  prependOnceListener (event: 'log', listener: (filePath: string, event: LogEvent) => void): this;
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this;

  removeListener (event: 'log', listener: (filePath: string, event: LogEvent) => void): this;
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this;
}
