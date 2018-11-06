export type Uri = string

export type Command = 'build' | 'clean' | 'graph' | 'load' | 'log' | 'save' | 'scrub' | 'test'

export interface LineRange {
  start: number
  end: number
}

export interface Reference {
  file: string
  range?: LineRange
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

export type OptionType = 'string' | 'strings' | 'number' | 'boolean' | 'variable'

export interface OptionDefinition {
  name: string,
  type: OptionType
  title?: string
  defaultValue?: any
  description: string
  values?: any[]
  aliases?: string[]
  noInvalidate?: boolean
}

// START_AUTO

export type BibtexEngine = 'bibtex' | 'bibtex8' | 'bibtexu' | 'pbibtex' | 'upbibtex'

export type DviToPdfEngine = 'dvipdfm' | 'xdvipdfmx' | 'dvipdfmx'

export type Engine = 'latex' | 'lualatex' | 'pdflatex' | 'platex' | 'uplatex' | 'xelatex'

export type EpstopdfBoundingBox = 'default' | 'exact' | 'hires'

export type IndexEngine = 'makeindex' | 'mendex' | 'texindy' | 'upmendex'

export type IndexOrdering = 'word' | 'letter'

export type IndexSorting = 'default' | 'german' | 'thai' | 'locale'

export type Kanji = 'euc' | 'jis' | 'sjis' | 'uptex' | 'utf8'

export type KanjiInternal = 'euc' | 'sjis' | 'uptex' | 'utf8'

export type Lhs2texStyle = 'poly' | 'math' | 'newCode' | 'code' | 'typewriter' | 'verbatim'

export type LiterateAgdaEngine = 'agda' | 'lhs2TeX' | 'none'

export type LiterateHaskellEngine = 'lhs2TeX' | 'none'

export type WeaveEngine = 'knitr' | 'metys' | 'pweave'

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
  cleanPatterns: string[]
  copyTargetsToRoot: boolean
  dviToPdfEngine: DviToPdfEngine
  engine: Engine
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
  jobName: string | null
  jobNames: (string | null)[]
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
  weaveEngine: WeaveEngine
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
  tests?: string[]
  validateCache: boolean
}

export interface JobOptions {
  [name: string]: any
  $BIBINPUTS?: string | string[]
  $BLTXMLINPUTS?: string | string[]
  $BSTINPUTS?: string | string[]
  $CLUAINPUTS?: string | string[]
  $LUAINPUTS?: string | string[]
  $MFINPUTS?: string | string[]
  $MPINPUTS?: string | string[]
  $PATH?: string | string[]
  $TEXINPUTS?: string | string[]
  $TEXPICTS?: string | string[]
  bibtexEngine?: BibtexEngine
  cleanPatterns?: string[]
  copyTargetsToRoot?: boolean
  dviToPdfEngine?: DviToPdfEngine
  engine?: Engine
  epstopdfBoundingBox?: EpstopdfBoundingBox
  epstopdfOutputPath?: string
  epstopdfRestricted?: boolean
  filePath?: string
  indexAutomaticRanges?: boolean
  indexCompressBlanks?: boolean
  indexDictionary?: string
  indexEngine?: IndexEngine
  indexForceKanji?: boolean
  indexLogPath?: string
  indexOrdering?: IndexOrdering
  indexOutputPath?: string
  indexSorting?: IndexSorting
  indexStartPage?: string
  indexStyle?: string
  intermediatePostScript?: boolean
  kanji?: Kanji
  kanjiInternal?: KanjiInternal
  knitrConcordance?: boolean
  knitrOutputPath?: string
  lhs2texStyle?: Lhs2texStyle
  literateAgdaEngine?: LiterateAgdaEngine
  literateHaskellEngine?: LiterateHaskellEngine
  loadCache?: boolean
  loadUserOptions?: boolean
  logCategory?: string
  weaveEngine?: WeaveEngine
  outputDirectory?: string
  outputFormat?: OutputFormat
  phaseCycles?: number
  pweaveCacheDirectory?: string
  pweaveDocumentationMode?: boolean
  pweaveFigureDirectory?: string
  pweaveKernel?: string
  pweaveOutputFormat?: PweaveOutputFormat
  pweaveOutputPath?: string
  saveCache?: boolean
  severity?: Severity
  shellEscape?: ShellEscape
  synctex?: boolean
  tests?: string[]
  validateCache?: boolean
}

export interface OptionsSource extends JobOptions {
  jobName?: string
  jobNames?: string[]
  jobs?: { [ jobName: string]: JobOptions }
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
  weaveEngine: 'knitr',
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
