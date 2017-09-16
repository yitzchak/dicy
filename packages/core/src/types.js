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
  type: 'string' | 'strings' | 'number' | 'boolean' | 'variable',
  defaultValue?: any,
  description: string,
  values?: Array<any>,
  aliases?: Array<string>,
  commands: Array<string>,
  noInvalidate?: boolean
}

export type KillToken = {
  error?: Error,
  resolve?: Function,
  promise?: Promise<void>
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

export type SourceMaps = {
  maps: Array<SourceMap>
}

// START_AUTO

export interface OptionsInterface {
  [name: string]: string | Array<string>,
  bibtexEngine: 'bibtex' | 'bibtex8' | 'bibtexu' | 'pbibtex' | 'upbibtex',
  check?: Array<string>,
  cleanPatterns: Array<string>,
  copyTargetsToRoot: boolean,
  disableRules: Array<string>,
  dviToPdfEngine: 'dvipdfm' | 'xdvipdfmx' | 'dvipdfmx',
  engine: string,
  epstopdfBoundingBox: 'default' | 'exact' | 'hires',
  epstopdfOutputPath: string,
  epstopdfRestricted: boolean,
  filePath: string,
  ignoreCache: boolean,
  ignoreUserOptions: boolean,
  indexAutomaticRanges: boolean,
  indexCompressBlanks: boolean,
  indexDictionary?: string,
  indexEngine: 'makeindex' | 'mendex' | 'texindy' | 'upmendex',
  indexForceKanji: boolean,
  indexLogPath?: string,
  indexOrdering: 'word' | 'letter',
  indexOutputPath?: string,
  indexSorting: 'default' | 'german' | 'thai' | 'locale',
  indexStartPage?: string,
  indexStyle?: string,
  intermediatePostScript: boolean,
  jobName?: string,
  jobNames: Array<string>,
  kanji?: 'euc' | 'jis' | 'sjis' | 'uptex' | 'utf8',
  kanjiInternal?: 'euc' | 'sjis' | 'uptex' | 'utf8',
  knitrConcordance: boolean,
  knitrOutputPath: string,
  lhs2texStyle: 'poly' | 'math' | 'newCode' | 'code' | 'typewriter' | 'verbatim',
  literateAgdaEngine: 'agda' | 'lhs2TeX' | 'none',
  literateHaskellEngine: 'lhs2TeX' | 'none',
  outputDirectory?: string,
  outputFormat: 'dvi' | 'pdf' | 'ps' | 'svg',
  phaseCycles: number,
  pweaveCacheDirectory: string,
  pweaveDocumentationMode: boolean,
  pweaveFigureDirectory: string,
  pweaveKernel: string,
  pweaveOutputFormat: 'tex' | 'texminted' | 'texpweave' | 'texpygments',
  pweaveOutputPath: string,
  severity: 'info' | 'warning' | 'error',
  shellEscape?: 'disabled' | 'restricted' | 'enabled',
  synctex: boolean
}

export const DEFAULT_OPTIONS = { $BIBINPUTS: [ '$ROOTDIR',
  '$ROOTDIR/$OUTDIR',
  '' ],
$TEXINPUTS: [ '$ROOTDIR',
  '$ROOTDIR/$OUTDIR',
  '' ],
bibtexEngine: 'bibtex',
cleanPatterns: [ '$OUTDIR/$JOB!($OUTEXT|.synctex.gz|.tex)',
  '/$OUTDIR/_minted-$JOB/*' ],
disableRules: [ ],
dviToPdfEngine: 'xdvipdfmx',
engine: 'pdflatex',
epstopdfBoundingBox: 'default',
epstopdfOutputPath: '$DIR_0/$NAME_0.pdf',
indexAutomaticRanges: true,
indexEngine: 'makeindex',
indexOrdering: 'word',
indexSorting: 'default',
knitrConcordance: true,
knitrOutputPath: '$JOB.tex',
lhs2texStyle: 'poly',
literateAgdaEngine: 'agda',
literateHaskellEngine: 'lhs2TeX',
outputFormat: 'pdf',
phaseCycles: 20,
pweaveCacheDirectory: 'pweave-cache-for-$JOB',
pweaveFigureDirectory: 'pweave-figures-for-$JOB',
pweaveKernel: 'python3',
pweaveOutputFormat: 'tex',
pweaveOutputPath: '$JOB.tex',
severity: 'warning' }

// END_AUTO

export type OptionInterfaceMap = { [name: string]: OptionsInterface }
