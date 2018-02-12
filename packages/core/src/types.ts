import {
  Command,
  LineRange,
  Message,
  OptionsInterface,
  Reference,
  Severity
} from '@dicy/types'

export interface GlobOptions {
  types?: 'all' | 'files' | 'directories'
  ignorePattern?: string[]
}

export type Phase = 'initialize' | 'execute' | 'finalize'

export type Action = 'parse' | 'run' | 'updateDependencies'

export type Group = 'opener'

export interface RuleDescription {
  commands: Command[]
  phases: Phase[]
  parameters?: string[][]
}

export interface RuleInfo {
  name: string
  description: string
}

export interface FileType {
  fileName?: RegExp
  contents?: RegExp
  hashSkip?: RegExp
  hashFilter?: string
}

export interface FileCache {
  timeStamp: Date
  hash?: string
  type?: string
  subType?: string
  value?: any
  jobNames?: string[]
}

export type DependencyType = 'default' | 'target'

export interface FileDependency {
  file: string,
  type?: DependencyType
}

export interface RuleCache {
  name: string
  command: Command
  phase: Phase
  jobName?: string
  parameters: string[]
  inputs: FileDependency[]
  outputs: FileDependency[]
}

export interface Cache {
  version: string
  filePath: string
  options: object
  files: { [filePath: string]: FileCache }
  rules: RuleCache[]
}

export const CACHE_VERSION = '0.12.2'

export interface ParserMatch {
  _: string
  captures: string[]
  groups: {[name: string]: string}
}

export interface Parser {
  modes?: string[]
  names?: string[]
  patterns: RegExp[]
  evaluate: (mode: string, reference: Reference, match: ParserMatch) => string | void
}

export interface KillToken {
  error?: Error
  resolve?: Function
  promise?: Promise<void>
}

export interface ShellCall {
  args: string[]
  options: { [name: string]: string | boolean }
  status: string
}

export interface ParsedLog {
  inputs: string[]
  outputs: string[]
  messages: Message[]
  calls: ShellCall[]
}

export interface CommandOptions {
  command: string[] | string
  cd: string
  spawn?: boolean
  severity?: Severity
  stdout?: boolean | string
  stderr?: boolean | string
  inputs?: FileDependency[]
  outputs?: FileDependency[]
  globbedInputs?: FileDependency[]
  globbedOutputs?: FileDependency[]
}

export interface ProcessResults {
  stdout: string
  stderr: string
}

export interface LineRangeMapping {
  input: LineRange
  output: LineRange
}

export interface SourceMap {
  input: string
  output: string
  mappings: LineRangeMapping[]
}

export interface SourceMaps {
  maps: SourceMap[]
}

export interface OptionInterfaceMap { [name: string]: OptionsInterface }
