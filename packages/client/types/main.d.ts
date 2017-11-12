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

export interface Client {
  start (argv: any): Promise<void>;
  exit (): void;
  getTargetPaths (filePath: string, absolute: boolean): Promise<string[]>;
  clear (filePath?: string): Promise<void>;
  kill (filePath?: string): Promise<void>;
  setInstanceOptions (filePath: string, options: object): Promise<boolean>;
  run (filePath: string, commands: Command[]): Promise<boolean>;
  updateOptions (filePath: string, options: object, user?: boolean): Promise<object>;
  onLog (handler: (filePath: string, event: LogEvent) => void): void;
}
