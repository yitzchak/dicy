# Common Options

## bibtexEngine

-   **Type:** string
-   **Default Value:** `bibtex`
-   **Values:** `bibtex`, `bibtex8`, `bibtexu`, `pbibtex`, `upbibtex`
-   **Commands:** [build][]
-   **Command Line Interface:** `--bibtex-engine <bibtexEngine>`

The program to use when processing BibTeX files and the backend is set to
`bibtex` versus `biber`.

## cleanPatterns

-   **Type:** array of strings
-   **Default Value:** `$OUTDIR/$JOB!($OUTEXT|.synctex.gz|.tex)`,
    `/$OUTDIR/_minted-$JOB/*`
-   **Commands:** [clean][]
-   **Command Line Interface:** `--clean-patterns <cleanPatterns>`

A list of file glob patterns to use when executing a [clean][] command. Each
glob pattern uses following syntax:

-   Typical glob patterns, like `**/*`, `foo/bar/*.pdf`.
-   Brace Expansion, like `foo/bar-{1..5}.tex` or `one/{two,three}/four.Rnw`.
-   Logical OR, like `foo/bar/(abc|xyz).js`
-   Regular Expression character classes, like `foo/bar/baz-[1-5].tex`
-   POSIX bracket expressions, like `**/[[:alpha:][:digit:]]/*`
-   Quantifiers, like `?(quux|bar)` or `+(quux|bar)`. `?` matches zero or one
    patterns, `*` matches zero or more patterns, `+` matches one or more patterns,
    `@` matches exactly one pattern, and `!` match anything but given patterns.
-   Value of environment variable using shell variable form (`$VAR` or `${VAR}`)
    or the following job variables.
    *   `$BASE` &mdash; File name of current source file.
    *   `$DIR` &mdash; Directory of current source file.
    *   `$EXT` &mdash; Extension of current source file.
    *   `$JOB` &mdash; Current job name or base name of source file if no job
        name is used.
    *   `$NAME` &mdash; File name of current source file with extension.
    *   `$OUTDIR` &mdash; Current output directory or `.` if no output directory
        has been specified.
    *   `$OUTEXT` &mdash; File extension associated with output format.
    *   `$ROOTDIR` &mdash; Directory of current main source file.

Patterns that begin with a slash or a backslash (`/` or `\`) are interpreted as
a file system glob pattern with the directory of the main source file as the
root directory. For instance, if the main source file path is `/foo/bar.tex` and
the pattern is `/gronk/*` then resulting pattern `/foo/gronk/*` will be used to
search for files or directories to remove during [clean][].

Patterns that do not begin with a slash or a backslash are interpreted as a
generated file glob pattern and will only match files explicitly created by a
rule during a command such as [build][]. For instance, `**/*.aux` will cause any
auxiliary files created by the [LaTeX][] rule to be removed during [clean][].

## consoleEventOutput

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** all
-   **Command Line Interface:**  `--console-event-output`

Output saved events in YAML format to console. This will supress all other
output.

## copyTargetsToRoot

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--copy-targets-to-root`

If [copyTargetsToRoot][] is `true` and [outputDirectory][] is not `.` for the
current job then the rule [CopyTargetsToRoot][] will copy each generated output
file to the directory that contains the source file. The original file will be
preserved so that the dependency tree will not be broken.

## disableRules

-   **Type:** array of strings
-   **Default Value:** none
-   **Commands:** all
-   **Command Line Interface:**  `--disable-rules <disableRules>`

Disable specific rules when processing.

## engine

-   **Type:** string
-   **Default Value:** `pdflatex`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--engine <engine>`, `-e <engine>`

The LaTeX engine to use when applying the [LaTeX][] rule, e.g. `latex`,
`pdflatex` or `uplatex`. The [LaTeX][] rule will select the output format
requested from the LaTeX engine based upon [outputFormat][] option and the
capabilities of the engine. For instance, selecting an [outputFormat][] of `pdf`
with and [engine][] of `latex` will result in a `dvi` file being generated which
will then be converted using the [DviToPdf][] rule. Whereas if the [engine][] is
set to `pdflatex` the `pdf` will be generated directly.

## epstopdfBoundingBox

-   **Type:** string
-   **Default Value:** `default`
-   **Values:** `default`, `exact`, `hires`
-   **Commands:** [build][]
-   **Command Line Interface:** `--epstopdf-bounding-box <epstopdfBoundingBox>`

Where epstopdf should its bounding box from.

## epstopdfOutputPath

-   **Type:** string
-   **Default Value:** `$DIR_0/$NAME_0.pdf`
-   **Commands:** [build][]
-   **Command Line Interface:** `--epstopdf-output-path <epstopdfOutputPath>`

The output path for epstopdf.

## epstopdfRestricted

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:** `--epstopdf-restricted`

Use restricted mode when calling epstopdf.

## filePath

-   **Type:** string
-   **Default Value:** none
-   **Commands:** [build][]

Override the master source file path for a specific job. This used to build
external dependencies not automatically generated by the [LaTeX][] rule. See
[Job Specific Source Files][] for more details.

## ignoreCache

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--ignore-cache`, `-i`

Ignore file cache generated by previous builds.

## ignoreUserOptions

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--ignore-user-options`

Ignore the `.dicy.yaml` options file in the user's home directory.

## indexAutomaticRanges

-   **Type:** boolean
-   **Default Value:** `true`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--no-index-automatic-ranges`

Use automatic page range formation. By default, three or more successive pages
are automatically abbreviated as a range (e.g. 1-3).

## indexCompressBlanks

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--index-compress-blanks`

Compress blanks in index labels.

## indexDictionary

-   **Type:** string
-   **Commands:** [build][]
-   **Command Line Interface:**  `--index-dictionary`

Pronounciation dictionary for mendex.

## indexEngine

-   **Type:** string
-   **Default Value:** `makeindex`
-   **Values:** `makeindex`, `mendex`, `texindy`, `upmendex`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--index-engine <indexEngine>`

Program used to index generation. If using a package like `imakeidx` which calls
and configures the index generation using shell escape or notifies the user of
the correct index call via LaTeX messages then DiCy will deduce the correct call
including engine and options.

## indexForceKanji

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--index-force-kanji`

Force to output Kanji characters even non-existent in dictionaries. Used by
mendex and upmended only.

## indexLogPath

-   **Type:** string
-   **Default Value:** computed
-   **Commands:** [build][]
-   **Command Line Interface:**  `--index-log-path`

The log path of the indexing engine.

## indexLogPath

-   **Type:** string
-   **Default Value:** computed
-   **Commands:** [build][]
-   **Command Line Interface:**  `--index-log-path`

The log path of the indexing engine.

## indexOrdering

-   **Type:** string
-   **Values:** `letter`, `word`
-   **Default Value:** `word`
-   **Commands:** build

Ordering scheme where `letter` ordering ignores spaces between words and `word`
ordering respects spaces between word.

## indexOutputPath

-   **Type:** string
-   **Default Value:** computed
-   **Commands:** [build][]
-   **Command Line Interface:**  `--index-output-path`

The output path of the indexing engine.

## indexSorting

-   **Type:** string
-   **Values:** `default`, `german`, `thai`, `locale`
-   **Default Value:** `default`
-   **Commands:** build

Set the sorting method to default (ASCII), german, thai or using the system
locale.

## indexStartPage

-   **Type:** string
-   **Values:** `any`, `odd`, `even` or number
-   **Commands:** build

Set the start page.

## indexStyle

-   **Type:** string
-   **Commands:** build

Use a custom style for formatting the index. For nomenclature indicies
`nomencl.ist` is used by default. For bibref indicies `bibref.ist` is used by
default.

## intermediatePostScript

-   **Type:** boolean
-   **Default Value:** false
-   **Commands:** [build][]
-   **Command Line Interface:**  `--intermediate-post-script, --ps`

Generate PostScript using dvips when the output format is pdf. This is only used
for LaTeX engines not capable of natively producing PDF.

## jobName

-   **Type:** string
-   **Default Value:** none
-   **Commands:** all
-   **Command Line Interface:**  `--job-name <jobName>`, `-j`

Job name used for latex.

## jobNames

-   **Type:** array of strings
-   **Default Value:** none
-   **Commands:** all
-   **Command Line Interface:**  `--job-names <jobNames>`

Job names used for latex.

## kanji

-   **Type:** string
-   **Values:** `euc`, `jis`, `sjis`, `uptex`, `utf8`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--kanji <kanji>`

Kanji encoding for pLaTeX, upLaTeX, pBibTeX, upBibTeX and mendex.

## kanjiInternal

-   **Type:** string
-   **Values:** `euc`, `sjis`, `uptex`, `utf8`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--kanji-internal <kanjiInternal>`

Internal kanji encoding for pLaTeX, upLaTeX, pBibTeX, upBibTeX and mendex.

## knitrConcordance

-   **Type:** boolean
-   **Default Value:** `true`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--knitr-concordance <knitrConcordance>`

Enable creation of knitr concordance file used to SyncTeX patching and source
code mapping in log messages.

## knitrOutputPath

-   **Type:** string
-   **Default Value:** `$JOB.tex`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--knitr-output-path <knitrOutputPath>`

## lhs2texStyle

-   **Type:** string
-   **Values:** `poly`, `newCode`, `code`, `math`, `typewritter`, `verbatim`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--lhs2tex-style <lhs2texStyle>`

Set the style that lhs2TeX will use with the default being `poly`.

## literateAgdaEngine

-   **Type:** string
-   **Values:** `agda`, `lhs2TeX` or `none`
-   **Default Value:** `agda`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--literate-agda-engine <engine>`, `-a <engine>`

The program to preprocess literate Agda source with before sending the source to
LaTeX. If `none` is selected then LaTeX will typeset the code directly without
preprocessing.

## literateHaskellEngine

-   **Type:** string
-   **Values:** `lhs2TeX` or `none`
-   **Default Value:** `lhs2TeX`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--literate-haskell-engine <engine>`, `-h <engine>`

The program to preprocess literate Haskell source with before sending the source to
LaTeX. If `none` is selected then LaTeX will typeset the code directly without
preprocessing.

## phaseCycles

-   **Type:** number
-   **Default Value:** `20`
-   **Commands:** all
-   **Command Line Interface:**  `--phase-cycles <phaseCycles>`

Maximum number of evaluation cycles in each phase.

## outputDirectory

-   **Type:** string
-   **Default Value:** none
-   **Commands:** [build][]
-   **Command Line Interface:**  `--output-directory <outputDirectory>`,
    `-o <outputDirectory>`

Name of directory for output files.

## outputFormat

-   **Type:** string
-   **Values:** `dvi`, `pdf`, `ps` or `svg`
-   **Default Value:** `pdf`
-   **Commands:** [build][]
-   **Command Line Interface:** `--output-format <outputFormat>`,
    `-f <outputFormat>`

Output format of main generated file.

## pweaveCacheDirectory

-   **Type:** string
-   **Default Value:** `pweave-cache-for-$JOB`
-   **Commands:** [build][]
-   **Command Line Interface:** `--pweave-cache-directory <pweaveCacheDirectory>`

Directory used for Pweave cache.

## pweaveDocumentationMode

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:** `--pweave-documentation-mode`

Use documentation mode for Pweave. Chunk code and results will be loaded from
cache and inline code will be hidden.

## pweaveFigureDirectory

-   **Type:** string
-   **Default Value:** `pweave-figures-for-$JOB`
-   **Commands:** [build][]
-   **Command Line Interface:** `--pweave-figure-directory <pweaveFigureDirectory>`

Directory used for Pweave figures.

## pweaveFigureFormat

-   **Type:** string
-   **Default Value:** `auto`
-   **Values:** `auto`, `pdf`, `eps`, `svg`
-   **Commands:** [build][]
-   **Command Line Interface:** `--pweave-figure-format <pweaveFigureFormat>`

Format used for Pweave figures.

## pweaveOutputFormat

-   **Type:** string
-   **Default Value:** `tex`
-   **Values:** `tex`, `texminted`, `texpygments`, `texpweave`
-   **Commands:** [build][]
-   **Command Line Interface:** `--pweave-output-format <pweaveOutputFormat>`

Format of code environments used by Pweave.

## pweaveOutputPath

-   **Type:** string
-   **Default Value:** `$JOB.tex`
-   **Commands:** [build][]
-   **Command Line Interface:** `--pweave-output-path <pweaveOutputPath>`

Output path of Pweave.

## saveEvents

-   **Type:** array of strings
-   **Values:** `action`, `command`, `fileAdded`, `fileChanged`, `fileDeleted`,
    `fileRemoved`, `inputAdded`, `log`, or `outputAdded`
-   **Default Value:** none
-   **Commands:** all
-   **Command Line Interface:** `--save-events <saveEvents>`

Save a transcript of received events to `$NAME-events.yaml` unless
[consoleEventOutput][] is enabled. This options is only available from the
command line interface and is primarily used to construct or provide output
parsible by a client.

## severity

-   **Type:** string
-   **Values:** `info`, `warning` or `error`
-   **Default Value:** `warning`
-   **Commands:** all
-   **Command Line Interface:**  `--severity <severity>`, `-s <severity>`

The severity of messages to display.

## shellEscape

-   **Type:** string
-   **Values:** `disable`, `restricted`, `enable`
-   **Default Value:** none
-   **Commands:** [build][]
-   **Command Line Interface:**  `--shell-escape <shellEscape>`

Enable shell escape (write18).

## synctex

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--synctex`

Generate SyncTeX annotations.

## verbose

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** all
-   **Command Line Interface:**  `--verbose`, `-v`

Only accessible from the command line interface, this option sets the verbosity
of the console output. When verbose is enabled then [action][] messages will be
displayed in addition to log messages specified by the [severity][] level.

# Environment Variables

Environment variables like `TEXINPUTS` may be set in any options file by
prefixing the variable with a `$`. For instance, the following YAML file will
set the environment variable `FOO` to the value of `bar`.

```yaml
$FOO: bar
```

Environment variables may refer to system level environment variables also. For
example the following will prefix the system search path with `/foo/bar`.

```yaml
$PATH: /foo/bar:$PATH
```

Path resolution (as detailed in [cleanPatterns][]) may also be done on
environment variable values by using arrays. For instance, the following will
set `TEXINPUTS` to `/baz:/baz/output:` if the current file path is
`/baz/gronk.tex`.

```yaml
outputDirectory: output
$TEXINPUTS:
  - $ROOTDIR
  - $ROOTDIR/$OUTDIR
  -
```

Kpathsea compliant TeX distributions typically use a trailing empty path to
indicate that the system default search path should be appended to the search
path specified by the environment variable. This convention can also be used
to set the system search path. The final item will be replaced with the value
of `PATH` (`Path` on Windows) from the system environment.

```yaml
outputDirectory: output
$PATH:
  - $ROOTDIR
  - $ROOTDIR/$OUTDIR
  -
```

[action]: events#action
[build]: commands#build
[clean]: commands#clean
[cleanPatterns]: #cleanpatterns
[consoleEventOutput]: #consoleeventoutput
[copyTargetsToRoot]: #copytargetstoroot
[DviToPdf]: rules#dvitopdf
[engine]: #engine
[Job Specific Source Files]: configuration#job-specific-source-files
[LaTeX]: rules#latex
[outputDirectory]: #outputdirectory
[outputFormat]: #outputformat
[severity]: #severity
