/* @flow */

export type globOptions = {
  types: 'all' | 'files' | 'directories',
  ignorePattern: string
}

export type Command = 'build' | 'clean' | 'graph' | 'load' | 'log' | 'save' | 'scrub'

export type Phase = 'initialize' | 'execute' | 'finalize'

export type Action = 'parse' | 'run' | 'updateDependencies'

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

export type FileEvent = {
  type: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved',
  file: string,
  virtual?: boolean
}

export type InputOutputEvent = {
  type: 'inputAdded' | 'outputAdded',
  rule: string,
  file: string,
  virtual?: boolean
}

export type Event = LogEvent | ActionEvent | CommandEvent | FileEvent | InputOutputEvent

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

export type ShellCall = {
  args: Array<string>,
  options: Object,
  status: string
}

export type ParsedLog = {
  inputs: Array<string>,
  outputs: Array<string>,
  messages: Array<Message>,
  calls: Array<ShellCall>
}

export type CommandOptions = {
  args: Array<string>,
  cd: string,
  severity: Severity,
  inputs?: Array<string>,
  outputs?: Array<string>,
  globbedInputs?: Array<string>,
  globbedOutputs?: Array<string>,
  stdout?: boolean | string,
  stderr?: boolean | string
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
