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

export interface LogEvent extends Message {
  type: 'log';
}

export interface ActionEvent {
  type: 'action';
  rule: string;
  action: string;
  triggers: string[];
}

export interface CommandEvent {
  type: 'command';
  rule: string;
  command: string;
}

export interface FileEvent {
  type: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved';
  file: string;
  virtual?: boolean;
}

export interface InputOutputEvent {
  type: 'inputAdded' | 'outputAdded';
  rule: string;
  file: string;
  virtual?: boolean;
}

export declare type Event = LogEvent | ActionEvent | CommandEvent | FileEvent | InputOutputEvent;

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
  getTargetPaths (): Promise<string[]>;
  kill(message?: string): Promise<void>;
  resolvePath (filePath: string): string;
  run(...commands: Command[]): Promise<boolean>;
  setInstanceOptions(options?: object): Promise<void>;
  updateOptions(options?: object, user?: boolean): Promise<object>;

  on (event: 'action', listener: (arg: ActionEvent) => void): this;
  on (event: 'command', listener: (arg: CommandEvent) => void): this;
  on (event: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved', listener: (arg: FileEvent) => void): this;
  on (event: 'inputAdded' | 'outputAdded', listener: (arg: InputOutputEvent) => void): this;
  on (event: 'log', listener: (arg: LogEvent) => void): this;
  on (event: string | symbol, listener: (...args: any[]) => void): this;

  once (event: 'action', listener: (arg: ActionEvent) => void): this;
  once (event: 'command', listener: (arg: CommandEvent) => void): this;
  once (event: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved', listener: (arg: FileEvent) => void): this;
  once (event: 'inputAdded' | 'outputAdded', listener: (arg: InputOutputEvent) => void): this;
  once (event: 'log', listener: (arg: LogEvent) => void): this;
  once (event: string | symbol, listener: (...args: any[]) => void): this;

  prependListener (event: 'action', listener: (arg: ActionEvent) => void): this;
  prependListener (event: 'command', listener: (arg: CommandEvent) => void): this;
  prependListener (event: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved', listener: (arg: FileEvent) => void): this;
  prependListener (event: 'inputAdded' | 'outputAdded', listener: (arg: InputOutputEvent) => void): this;
  prependListener (event: 'log', listener: (arg: LogEvent) => void): this;
  prependListener (event: string | symbol, listener: (...args: any[]) => void): this;

  prependOnceListener (event: 'action', listener: (arg: ActionEvent) => void): this;
  prependOnceListener (event: 'command', listener: (arg: CommandEvent) => void): this;
  prependOnceListener (event: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved', listener: (arg: FileEvent) => void): this;
  prependOnceListener (event: 'inputAdded' | 'outputAdded', listener: (arg: InputOutputEvent) => void): this;
  prependOnceListener (event: 'log', listener: (arg: LogEvent) => void): this;
  prependOnceListener (event: string | symbol, listener: (...args: any[]) => void): this;

  removeListener (event: 'action', listener: (arg: ActionEvent) => void): this;
  removeListener (event: 'command', listener: (arg: CommandEvent) => void): this;
  removeListener (event: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved', listener: (arg: FileEvent) => void): this;
  removeListener (event: 'inputAdded' | 'outputAdded', listener: (arg: InputOutputEvent) => void): this;
  removeListener (event: 'log', listener: (arg: LogEvent) => void): this;
  removeListener (event: string | symbol, listener: (...args: any[]) => void): this;
}
