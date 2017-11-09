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

export interface Client {
  start (argv: any): Promise<void>;
  exit (): void;
  getTargetPaths (filePath: string, absolute: boolean): Promise<string[]>;
  clear (filePath?: string): Promise<void>;
  kill (filePath?: string): Promise<void>;
  setInstanceOptions (filePath: string, options: object): Promise<boolean>;
  run (filePath: string, commands: Command[]): Promise<boolean>;
  updateOptions (filePath: string, options: object, user?: boolean): Promise<object>;

  onAction (handler: (filePath: string, event: ActionEvent) => void): void;
  onCommand (handler: (filePath: string, event: CommandEvent) => void): void;
  onFileAdded (handler: (filePath: string, event: FileEvent) => void): void;
  onFileChanged (handler: (filePath: string, event: FileEvent) => void): void;
  onFileDeleted (handler: (filePath: string, event: CommandEvent) => void): void;
  onFileRemoved (handler: (filePath: string, event: FileEvent) => void): void;
  onInputAdded (handler: (filePath: string, event: InputOutputEvent) => void): void;
  onLog (handler: (filePath: string, event: LogEvent) => void): void;
  onOutputAdded (handler: (filePath: string, event: InputOutputEvent) => void): void;
}
