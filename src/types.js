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
