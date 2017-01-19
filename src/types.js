/* @flow */

export type FileType = {
  fileName?: RegExp,
  contents?: RegExp,
  hashSkip?: RegExp
}

export type FileCache = {
  timeStamp: Date,
  hash: string,
  type?: string
}

export type RuleCache = {
  timeStamp: Date,
  inputs: Array<string>,
  outputs: Array<string>
}

export type Parser = {
  names: Array<string>,
  patterns: Array<RegExp>,
  evaluate: (reference: Reference, groups: Object) => void
}

export type Reference = {
  file: string,
  start: ?number,
  end: ?number
}

export type Severity = 'info' | 'warning' | 'error'

export type Message = {
  severity: Severity,
  text: string,
  name?: string,
  type?: string,
  source?: Reference,
  log?: Reference
}

export type Phase = 'configure' | 'initialize' | 'execute' | 'finalize'

export type Command = 'build' | 'report'

export type Log = (message: Message) => void
