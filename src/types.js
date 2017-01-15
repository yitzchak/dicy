/* @flow */

export type FileType = {
  fileName?: RegExp,
  contents?: RegExp
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

export type Message = {
  severity: 'info' | 'warning' | 'error',
  text: string,
  name?: string,
  type?: string,
  source?: Reference,
  log?: Reference
}
