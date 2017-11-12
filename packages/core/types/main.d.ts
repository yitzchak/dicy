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

export declare type Severity = 'trace' | 'info' | 'warning' | 'error';

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

export class DiCy extends EventEmitter {
  static create(filePath: string, options?: object): Promise<DiCy>;
  static getOptionDefinitions(): Promise<Option[]>;
  getTargetPaths (absolute?: boolean): Promise<string[]>;
  kill(message?: string): Promise<void>;
  resolvePath (filePath: string): string;
  run(...commands: Command[]): Promise<boolean>;
  setInstanceOptions(options?: object): Promise<void>;
  updateOptions(options?: object, user?: boolean): Promise<object>;

  on (event: 'log', listener: (arg: LogEvent) => void): this;
  on (event: string | symbol, listener: (...args: any[]) => void): this;

  once (event: 'log', listener: (arg: LogEvent) => void): this;
  once (event: string | symbol, listener: (...args: any[]) => void): this;

  prependListener (event: 'log', listener: (arg: LogEvent) => void): this;
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this;

  prependOnceListener (event: 'log', listener: (arg: LogEvent) => void): this;
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this;

  removeListener (event: 'log', listener: (arg: LogEvent) => void): this;
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this;
}
