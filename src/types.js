/* @flow */

export type FileType = {
  namePattern?: RegExp,
  contentsPattern?: RegExp
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
