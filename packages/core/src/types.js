/* @flow */

export type globOptions = {
  types: 'all' | 'files' | 'directories',
  ignorePattern: string
}

export type Command = 'build' | 'clean' | 'graph' | 'load' | 'log' | 'save' | 'scrub'

export type Phase = 'initialize' | 'execute' | 'finalize'

export type Action = 'run' | 'updateDependencies'

export type RuleInfo = {
  name: string,
  description: string
}

export type FileType = {
  fileName?: RegExp,
  contents?: RegExp,
  hashSkip?: RegExp
}

export type FileCache = {
  timeStamp: Date,
  hash: string,
  type?: string,
  subType?: string,
  value?: any,
  jobNames?: Array<string>
}

export type RuleCache = {
  name: string,
  command: Command,
  phase: Phase,
  jobName?: string,
  parameters: Array<string>,
  inputs: Array<string>,
  outputs: Array<string>
}

export type Cache = {
  filePath: string,
  options: Object,
  files: { [filePath: string]: FileCache },
  rules: Array<RuleCache>
}

export type LineRange = {
  start: number,
  end: number
}

export type Reference = {
  file: string,
  range?: LineRange
}

export type Parser = {
  names: Array<string>,
  patterns: Array<RegExp>,
  evaluate: (reference: Reference, groups: Object) => void
}

export type Severity = 'info' | 'warning' | 'error'

export type Message = {
  severity: Severity,
  text: string,
  name?: string,
  category?: string,
  source?: Reference,
  log?: Reference
}

export type LogEvent = {
  type: 'log',
  severity: Severity,
  text: string,
  name?: string,
  category?: string,
  source?: Reference,
  log?: Reference
}

export type ActionEvent = {
  type: 'action',
  rule: string,
  action: string,
  triggers: Array<string>
}

export type CommandEvent = {
  type: 'command',
  rule: string,
  command: string
}

export type FileChangedEvent = {
  type: 'fileChanged',
  file: string
}

export type FileAddedEvent = {
  type: 'fileAdded',
  file: string
}

export type FileDeletedEvent = {
  type: 'fileDeleted',
  file: string
}

export type FileRemovedEvent = {
  type: 'fileRemoved',
  file: string
}

export type InputAddedEvent = {
  type: 'inputAdded',
  rule: string,
  file: string
}

export type OutputAddedEvent = {
  type: 'outputAdded',
  rule: string,
  file: string
}

export type Event = LogEvent | ActionEvent | CommandEvent | FileAddedEvent |
  FileDeletedEvent | FileRemovedEvent | FileChangedEvent | InputAddedEvent |
  OutputAddedEvent

export type Option = {
  name: string,
  type: 'string' | 'strings' | 'number' | 'numbers' | 'boolean',
  defaultValue?: any,
  description: string,
  values?: Array<any>,
  aliases?: Array<string>,
  commands: Array<string>,
  noInvalidate?: boolean
}

export type KillToken = {
  error: ?Error,
  resolve: ?Function,
  promise: ?Promise<void>
}

export type CommandOptions = {
  args: Array<string>,
  severity: Severity
}

export type LineRangeMapping = {
  input: LineRange,
  output: LineRange
}

export type SourceMap = {
  input: string,
  output: string,
  mappings: Array<LineRangeMapping>
}
