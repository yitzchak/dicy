export interface GlobOptions {
  types?: 'all' | 'files' | 'directories'
  ignorePattern?: string | string[]
}

export type Command = 'build' | 'clean' | 'graph' | 'load' | 'log' | 'save' | 'scrub'

export type Phase = 'initialize' | 'execute' | 'finalize'

export type Action = 'parse' | 'run' | 'updateDependencies'

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

export interface RuleCache {
  name: string
  command: Command
  phase: Phase
  jobName?: string
  parameters: string[]
  inputs: string[]
  outputs: string[]
}

export interface Cache {
  version: string
  filePath: string
  options: object
  files: { [filePath: string]: FileCache }
  rules: RuleCache[]
}

export const CACHE_VERSION = '0.10.0'

export interface LineRange {
  start: number
  end: number
}

export interface Reference {
  file: string
  range?: LineRange
}

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

export type Severity = 'trace' | 'info' | 'warning' | 'error'

export interface Message {
  severity: Severity
  text: string
  name?: string
  category?: string
  source?: Reference
  log?: Reference
}

export interface LogEvent {
  type: 'log'
  messages: Message[]
}

export interface Option {
  name: string
  type: 'string' | 'strings' | 'number' | 'boolean' | 'variable'
  defaultValue?: any
  description: string
  values?: any[]
  aliases?: string[]
  commands?: string[]
  noInvalidate?: boolean
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
  args: string[]
  cd: string
  severity: Severity
  inputs?: string[]
  outputs?: string[]
  globbedInputs?: string[]
  globbedOutputs?: string[]
  stdout?: boolean | string
  stderr?: boolean | string
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

// START_AUTO

export type BibtexEngine = 'bibtex' | 'bibtex8' | 'bibtexu' | 'pbibtex' | 'upbibtex'

export type DviToPdfEngine = 'dvipdfm' | 'xdvipdfmx' | 'dvipdfmx'

export type EpstopdfBoundingBox = 'default' | 'exact' | 'hires'

export type IndexEngine = 'makeindex' | 'mendex' | 'texindy' | 'upmendex'

export type IndexOrdering = 'word' | 'letter'

export type IndexSorting = 'default' | 'german' | 'thai' | 'locale'

export type Kanji = 'euc' | 'jis' | 'sjis' | 'uptex' | 'utf8'

export type KanjiInternal = 'euc' | 'sjis' | 'uptex' | 'utf8'

export type Lhs2texStyle = 'poly' | 'math' | 'newCode' | 'code' | 'typewriter' | 'verbatim'

export type LiterateAgdaEngine = 'agda' | 'lhs2TeX' | 'none'

export type LiterateHaskellEngine = 'lhs2TeX' | 'none'

export type OutputFormat = 'dvi' | 'pdf' | 'ps' | 'svg'

export type PweaveOutputFormat = 'tex' | 'texminted' | 'texpweave' | 'texpygments'

export type ShellEscape = 'disabled' | 'restricted' | 'enabled'

export interface OptionsInterface {
  [name: string]: any
  $BIBINPUTS: string | string[]
  $BLTXMLINPUTS?: string | string[]
  $BSTINPUTS?: string | string[]
  $CLUAINPUTS?: string | string[]
  $LUAINPUTS?: string | string[]
  $MFINPUTS?: string | string[]
  $MPINPUTS?: string | string[]
  $PATH?: string | string[]
  $TEXINPUTS: string | string[]
  $TEXPICTS?: string | string[]
  bibtexEngine: BibtexEngine
  check?: string[]
  cleanPatterns: string[]
  copyTargetsToRoot: boolean
  dviToPdfEngine: DviToPdfEngine
  engine: string
  epstopdfBoundingBox: EpstopdfBoundingBox
  epstopdfOutputPath: string
  epstopdfRestricted: boolean
  filePath: string
  indexAutomaticRanges: boolean
  indexCompressBlanks: boolean
  indexDictionary?: string
  indexEngine: IndexEngine
  indexForceKanji: boolean
  indexLogPath?: string
  indexOrdering: IndexOrdering
  indexOutputPath?: string
  indexSorting: IndexSorting
  indexStartPage?: string
  indexStyle?: string
  intermediatePostScript: boolean
  jobName?: string
  jobNames: string[]
  kanji?: Kanji
  kanjiInternal?: KanjiInternal
  knitrConcordance: boolean
  knitrOutputPath: string
  lhs2texStyle: Lhs2texStyle
  literateAgdaEngine: LiterateAgdaEngine
  literateHaskellEngine: LiterateHaskellEngine
  loadCache: boolean
  loadUserOptions: boolean
  logCategory?: string
  outputDirectory?: string
  outputFormat: OutputFormat
  phaseCycles: number
  pweaveCacheDirectory: string
  pweaveDocumentationMode: boolean
  pweaveFigureDirectory: string
  pweaveKernel: string
  pweaveOutputFormat: PweaveOutputFormat
  pweaveOutputPath: string
  saveCache: boolean
  severity: Severity
  shellEscape?: ShellEscape
  synctex: boolean
  validateCache: boolean
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
  validateCache: true }

// END_AUTO

export interface OptionInterfaceMap { [name: string]: OptionsInterface }
