export type GlobOptions = {
  types?: 'all' | 'files' | 'directories',
  ignorePattern?: string | string[]
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
  hashSkip?: RegExp,
  hashFilter?: string
}

export type FileCache = {
  timeStamp: Date,
  hash?: string,
  type?: string,
  subType?: string,
  value?: any,
  jobNames?: string[]
}

export type RuleCache = {
  name: string,
  command: Command,
  phase: Phase,
  jobName?: string,
  parameters: string[],
  inputs: string[],
  outputs: string[]
}

export type Cache = {
  version: string,
  filePath: string,
  options: Object,
  files: { [filePath: string]: FileCache },
  rules: RuleCache[]
}

export const CACHE_VERSION = '0.10.0'

export type LineRange = {
  start: number,
  end: number
}

export type Reference = {
  file: string,
  range?: LineRange
}

export type ParserMatch = {
  _: string,
  captures: string[],
  groups: {[name: string]: string}
}

export type Parser = {
  modes?: string[],
  names?: string[],
  patterns: RegExp[],
  evaluate: (mode: string, reference: Reference, match: ParserMatch) => string | void
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
  triggers: string[]
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
  type: 'string' | 'strings' | 'number' | 'boolean' | 'variable',
  defaultValue?: any,
  description: string,
  values?: any[],
  aliases?: string[],
  commands?: string[],
  noInvalidate?: boolean
}

export type KillToken = {
  error?: Error,
  resolve?: Function,
  promise?: Promise<void>
}

export type ShellCall = {
  args: string[],
  options: { [name: string]: string | boolean },
  status: string
}

export type ParsedLog = {
  inputs: string[],
  outputs: string[],
  messages: Message[],
  calls: ShellCall[]
}

export type CommandOptions = {
  args: string[],
  cd: string,
  severity: Severity,
  inputs?: string[],
  outputs?: string[],
  globbedInputs?: string[],
  globbedOutputs?: string[],
  stdout?: boolean | string,
  stderr?: boolean | string
}

export type ProcessResults = {
  stdout: string,
  stderr: string
}

export type LineRangeMapping = {
  input: LineRange,
  output: LineRange
}

export type SourceMap = {
  input: string,
  output: string,
  mappings: LineRangeMapping[]
}

export type SourceMaps = {
  maps: SourceMap[]
}

// START_AUTO

export type IndexEngine = 'makeindex' | 'mendex' | 'texindy' | 'upmendex'

export interface OptionsInterface {
  [name: string]: any,
  $BIBINPUTS: string | string[],
  $TEXINPUTS: string | string[],
  bibtexEngine: 'bibtex' | 'bibtex8' | 'bibtexu' | 'pbibtex' | 'upbibtex',
  check?: string[],
  cleanPatterns: string[],
  copyTargetsToRoot: boolean,
  dviToPdfEngine: 'dvipdfm' | 'xdvipdfmx' | 'dvipdfmx',
  engine: string,
  epstopdfBoundingBox: 'default' | 'exact' | 'hires',
  epstopdfOutputPath: string,
  epstopdfRestricted: boolean,
  filePath: string,
  indexAutomaticRanges: boolean,
  indexCompressBlanks: boolean,
  indexDictionary?: string,
  indexEngine: IndexEngine,
  indexForceKanji: boolean,
  indexLogPath?: string,
  indexOrdering: 'word' | 'letter',
  indexOutputPath?: string,
  indexSorting: 'default' | 'german' | 'thai' | 'locale',
  indexStartPage?: string,
  indexStyle?: string,
  intermediatePostScript: boolean,
  jobName?: string,
  jobNames: string[],
  kanji?: 'euc' | 'jis' | 'sjis' | 'uptex' | 'utf8',
  kanjiInternal?: 'euc' | 'sjis' | 'uptex' | 'utf8',
  knitrConcordance: boolean,
  knitrOutputPath: string,
  lhs2texStyle: 'poly' | 'math' | 'newCode' | 'code' | 'typewriter' | 'verbatim',
  literateAgdaEngine: 'agda' | 'lhs2TeX' | 'none',
  literateHaskellEngine: 'lhs2TeX' | 'none',
  loadCache: boolean,
  loadUserOptions: boolean,
  outputDirectory?: string,
  outputFormat: 'dvi' | 'pdf' | 'ps' | 'svg',
  phaseCycles: number,
  pweaveCacheDirectory: string,
  pweaveDocumentationMode: boolean,
  pweaveFigureDirectory: string,
  pweaveKernel: string,
  pweaveOutputFormat: 'tex' | 'texminted' | 'texpweave' | 'texpygments',
  pweaveOutputPath: string,
  saveCache: boolean,
  severity: 'info' | 'warning' | 'error',
  shellEscape?: 'disabled' | 'restricted' | 'enabled',
  synctex: boolean,
  validateCache: boolean
}

export const DEFAULT_OPTIONS = {
  $BIBINPUTS: [ '$ROOTDIR',
    '$ROOTDIR/$OUTDIR',
    '' ],
  $TEXINPUTS: [ '$ROOTDIR',
    '$ROOTDIR/$OUTDIR',
    '' ],
  bibtexEngine: 'bibtex',
  cleanPatterns: [ '$OUTDIR/$JOB!($OUTEXT|.synctex.gz|.tex)',
    '/$OUTDIR/_minted-$JOB/*' ],
  copyTargetsToRoot: false,
  dviToPdfEngine: 'xdvipdfmx',
  engine: 'pdflatex',
  epstopdfBoundingBox: 'default',
  epstopdfOutputPath: '$DIR_0/$NAME_0.pdf',
  epstopdfRestricted: false,
  indexAutomaticRanges: true,
  indexEngine: 'makeindex',
  indexOrdering: 'word',
  indexSorting: 'default',
  knitrConcordance: true,
  knitrOutputPath: '$JOB.tex',
  lhs2texStyle: 'poly',
  literateAgdaEngine: 'agda',
  literateHaskellEngine: 'lhs2TeX',
  loadCache: true,
  loadUserOptions: true,
  outputFormat: 'pdf',
  phaseCycles: 20,
  pweaveCacheDirectory: 'pweave-cache-for-$JOB',
  pweaveFigureDirectory: 'pweave-figures-for-$JOB',
  pweaveKernel: 'python3',
  pweaveOutputFormat: 'tex',
  pweaveOutputPath: '$JOB.tex',
  saveCache: true,
  severity: 'warning',
  validateCache: true
}

// END_AUTO

export type OptionInterfaceMap = { [name: string]: OptionsInterface }
