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
}
