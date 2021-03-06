# Common Options

## bibtexEngine

-   **Type:** string
-   **Default Value:** `bibtex`
-   **Values:** `bibtex`, `bibtex8`, `bibtexu`, `pbibtex`, `upbibtex`
-   **Command Line Interface:** `--bibtex-engine <bibtexEngine>`

The program to use when processing BibTeX files and the backend is set to
`bibtex` versus `biber`.

## cleanPatterns

-   **Type:** array of strings
-   **Default Value:** `$OUTDIR/$JOB!($OUTEXT|.synctex.gz|.tex)`,
    `/$OUTDIR/_minted-$JOB/*`
-   **Command Line Interface:** `--clean-patterns <cleanPatterns>`

A list of file glob patterns to use when executing a [clean][] or a [scrub][]
command. Each glob pattern uses following syntax:

-   Typical glob patterns, like `**/*`, `foo/bar/*.pdf`.
-   Brace Expansion, like `foo/bar-{1..5}.tex` or `one/{two,three}/four.Rnw`.
-   Logical OR, like `foo/bar/(abc|xyz).js`
-   Regular Expression character classes, like `foo/bar/baz-[1-5].tex`
-   POSIX bracket expressions, like `**/[[:alpha:][:digit:]]/*`
-   Quantifiers, like `?(quux|bar)` or `+(quux|bar)`. `?` matches zero or one
    patterns, `*` matches zero or more patterns, `+` matches one or more
    patterns, `@` matches exactly one pattern, and `!` match anything but given
    patterns.
-   Value of environment variable using shell variable form (`$VAR` or `${VAR}`)
    or the following job variables.
    -   `$BASE` — File name of current source file.
    -   `$DIR` — Directory of current source file.
    -   `$EXT` — Extension of current source file.
    -   `$JOB` — Current job name or base name of source file if no job
        name is used.
    -   `$NAME` — File name of current source file with extension.
    -   `$OUTDIR` — Current output directory or `.` if no output directory
        has been specified.
    -   `$OUTEXT` — File extension associated with output format.
    -   `$ROOTDIR` — Directory of current main source file.

Patterns that begin with a slash or a backslash (`/` or `\`) are interpreted as
a file system glob pattern with the directory of the main source file as the
root directory. For instance, if the main source file path is `/foo/bar.tex` and
the pattern is `/gronk/*` then resulting pattern `/foo/gronk/*` will be used to
search for files or directories to remove during [clean][].

Patterns that do not begin with a slash or a backslash are interpreted as a
generated file glob pattern and will only match files explicitly created by a
rule during a command such as [build][]. For instance, `**/*.aux` will cause any
auxiliary files created by LaTeX to be removed during [clean][].

## copyTargetsToRoot

-   **Type:** boolean
-   **Default Value:** `false`
-   **Command Line Interface:** `--copy-targets-to-root`

Enable the copying of targets to the directory that contains the source file.
This will only be done if the output directory is not set to `.`. The original
file will be preserved so that the dependency graph will not be broken.

## dviToPdfEngine

-   **Type:** string
-   **Default Value:** `xdvipdfmx`
-   **Values:** `dvipdfm`, `dvipdfmx`, `xdvipdfmx`
-   **COmmand Line Interface:** `--dvi-to-pdf-engine <dviToPdfEngine>`

Program to use for DVI to PDF conversion.

## engine

-   **Type:** string
-   **Default Value:** `pdflatex`
-   **Command Line Interface:** `--engine <engine>`, `-e <engine>`

The LaTeX engine to use when applying the LaTeX rule, e.g. `latex`, `pdflatex`
or `uplatex`. The LaTeX rule will select the output format requested from the
LaTeX engine based upon [outputFormat][] option and the capabilities of the
engine. For instance, selecting an [outputFormat][] of `pdf` with and [engine][]
of `latex` will result in a `dvi` file being generated which will then be
converted using the DviToPdf rule. Whereas if the [engine][] is set to
`pdflatex` the `pdf` will be generated directly.

## epstopdfBoundingBox

-   **Type:** string
-   **Default Value:** `default`
-   **Values:** `default`, `exact`, `hires`
-   **Command Line Interface:** `--epstopdf-bounding-box <epstopdfBoundingBox>`

Where epstopdf should get its bounding box from.

## epstopdfOutputPath

-   **Type:** string
-   **Default Value:** `$DIR_0/$NAME_0.pdf`
-   **Command Line Interface:** `--epstopdf-output-path <epstopdfOutputPath>`

The output path for epstopdf.

## epstopdfRestricted

-   **Type:** boolean
-   **Default Value:** `false`
-   **Command Line Interface:** `--epstopdf-restricted`

Use restricted mode when calling epstopdf.

## filePath

-   **Type:** string
-   **Default Value:** none

Override the master source file path for a specific job. This used to build
external dependencies not automatically generated by the LaTeX rule. See
[Job Specific Source Files][] for more details.

## indexAutomaticRanges

-   **Type:** boolean
-   **Default Value:** `true`
-   **Command Line Interface:** `--no-index-automatic-ranges`

Use automatic page range formation. By default, three or more successive pages
are automatically abbreviated as a range (e.g. 1-3).

## indexCompressBlanks

-   **Type:** boolean
-   **Default Value:** `false`
-   **Command Line Interface:** `--index-compress-blanks`

Compress blanks in index labels.

## indexDictionary

-   **Type:** string
-   **Command Line Interface:** `--index-dictionary`

Pronounciation dictionary for mendex.

## indexEngine

-   **Type:** string
-   **Default Value:** `makeindex`
-   **Values:** `makeindex`, `mendex`, `texindy`, `upmendex`
-   **Command Line Interface:** `--index-engine <indexEngine>`

Program used for index generation. If using a package like `imakeidx` which
calls and configures the index generation using shell escape or notifies the
user of the correct index call via LaTeX messages then the correct engine and
options will deduced from those messages.

## indexForceKanji

-   **Type:** boolean
-   **Default Value:** `false`
-   **Command Line Interface:** `--index-force-kanji`

Enable forcing output of Kanji characters even if non-existent in dictionaries.
Used by mendex and upmendex only.

## indexLogPath

-   **Type:** string
-   **Default Value:** computed
-   **Command Line Interface:** `--index-log-path`

The log path of the indexing engine.

## indexLogPath

-   **Type:** string
-   **Default Value:** computed
-   **Command Line Interface:** `--index-log-path`

The log path of the indexing engine.

## indexOrdering

-   **Type:** string
-   **Values:** `letter`, `word`
-   **Default Value:** `word`

Ordering scheme where `letter` ordering ignores spaces between words and `word`
ordering respects spaces between word.

## indexOutputPath

-   **Type:** string
-   **Default Value:** computed
-   **Command Line Interface:** `--index-output-path`

The output path of the indexing engine.

## indexSorting

-   **Type:** string
-   **Values:** `default`, `german`, `thai`, `locale`
-   **Default Value:** `default`

Set the sorting method to default (ASCII), german, thai or using the system
locale.

## indexStartPage

-   **Type:** string
-   **Values:** `any`, `odd`, `even` or number

Set the start page.

## indexStyle

-   **Type:** string

Use a custom style for formatting the index. For nomenclature indicies
`nomencl.ist` is used by default. For bibref indicies `bibref.ist` is used by
default.

## intermediatePostScript

-   **Type:** boolean
-   **Default Value:** false
-   **Command Line Interface:** `--intermediate-post-script, --ps`

Generate PostScript using dvips when the output format is pdf. This is only used
for LaTeX engines not capable of natively producing PDF.

## jobName

-   **Type:** string
-   **Default Value:** none
-   **Command Line Interface:** `--job-name <jobName>`, `-j`

Job name used for latex.

## jobNames

-   **Type:** array of strings
-   **Default Value:** none
-   **Command Line Interface:** `--job-names <jobNames>`

Job names used for latex.

## kanji

-   **Type:** string
-   **Values:** `euc`, `jis`, `sjis`, `uptex`, `utf8`
-   **Command Line Interface:** `--kanji <kanji>`

Kanji encoding for pLaTeX, upLaTeX, pBibTeX, upBibTeX and mendex.

## kanjiInternal

-   **Type:** string
-   **Values:** `euc`, `sjis`, `uptex`, `utf8`
-   **Command Line Interface:** `--kanji-internal <kanjiInternal>`

Internal kanji encoding for pLaTeX, upLaTeX, pBibTeX, upBibTeX and mendex.

## knitrConcordance

-   **Type:** boolean
-   **Default Value:** `true`
-   **Command Line Interface:** `--no-knitr-concordance`

Enable/disable creation of knitr concordance file used to SyncTeX patching and
source code mapping in log messages.

## knitrOutputPath

-   **Type:** string
-   **Default Value:** `$JOB.tex`
-   **Command Line Interface:** `--knitr-output-path <knitrOutputPath>`

## lhs2texStyle

-   **Type:** string
-   **Values:** `poly`, `newCode`, `code`, `math`, `typewritter`, `verbatim`
-   **Command Line Interface:** `--lhs2tex-style <lhs2texStyle>`

Set the style that lhs2TeX will use with the default being `poly`.

## literateAgdaEngine

-   **Type:** string
-   **Values:** `agda`, `lhs2TeX` or `none`
-   **Default Value:** `agda`
-   **Command Line Interface:** `--literate-agda-engine <engine>`, `-a <engine>`

The program to preprocess literate Agda source with before sending the source to
LaTeX. If `none` is selected then LaTeX will typeset the code directly without
preprocessing.

## literateHaskellEngine

-   **Type:** string
-   **Values:** `lhs2TeX` or `none`
-   **Default Value:** `lhs2TeX`
-   **Command Line Interface:**
    `--literate-haskell-engine <engine>`, `-h <engine>`

The program to preprocess literate Haskell source with before sending the source
to LaTeX. If `none` is selected then LaTeX will typeset the code directly
without preprocessing.

## loadCache

-   **Type:** boolean
-   **Default Value:** `true`
-   **Command Line Interface:** `--no-load-cache`, `-L`

Load file cache generated by previous builds.

## loadUserOptions

-   **Type:** boolean
-   **Default Value:** `true`
-   **Command Line Interface:** `--no-load-user-options`

Load options from the `.dicy.yaml` options file in the user's home directory.

## phaseCycles

-   **Type:** number
-   **Default Value:** `20`
-   **Command Line Interface:** `--phase-cycles <phaseCycles>`

Maximum number of evaluation cycles in each phase.

## outputDirectory

-   **Type:** string
-   **Default Value:** none
-   **Command Line Interface:** `--output-directory <outputDirectory>`,
    `-o <outputDirectory>`

Name of directory for output files.

## outputFormat

-   **Type:** string
-   **Values:** `dvi`, `pdf`, `ps` or `svg`
-   **Default Value:** `pdf`
-   **Command Line Interface:** `--output-format <outputFormat>`,
    `-f <outputFormat>`

Output format of main generated file.

## pweaveCacheDirectory

-   **Type:** string
-   **Default Value:** `pweave-cache-for-$JOB`
-   **Command Line Interface:**
    `--pweave-cache-directory <pweaveCacheDirectory>`

Directory used for Pweave cache.

## pweaveDocumentationMode

-   **Type:** boolean
-   **Default Value:** `false`
-   **Command Line Interface:** `--pweave-documentation-mode`

Use documentation mode for Pweave. Chunk code and results will be loaded from
cache and inline code will be hidden.

## pweaveFigureDirectory

-   **Type:** string
-   **Default Value:** `pweave-figures-for-$JOB`
-   **Command Line Interface:**
    `--pweave-figure-directory <pweaveFigureDirectory>`

Directory used for Pweave figures.

## pweaveKernel

-   **Type:** string
-   **Default Value:** `python3`
-   **Command Line Interface:** `--pweave-kernel <pweaveKernel>`

Jupyter kernel used to run code.

## pweaveOutputFormat

-   **Type:** string
-   **Default Value:** `tex`
-   **Values:** `tex`, `texminted`, `texpygments`, `texpweave`
-   **Command Line Interface:** `--pweave-output-format <pweaveOutputFormat>`

Format of code environments used by Pweave.

## pweaveOutputPath

-   **Type:** string
-   **Default Value:** `$JOB.tex`
-   **Command Line Interface:** `--pweave-output-path <pweaveOutputPath>`

Output path of Pweave.

## saveCache

-   **Type:** boolean
-   **Default Value:** `true`
-   **Command Line Interface:** `--no-save-cache`, `-S`

Save file cache generated by previous builds.

## saveLog

-   **Type:** boolean
-   **Default Value:** `false`
-   **Command Line Interface:** `--save-log`

Save a transcript of the log to `$NAME-log.yaml`. This option is only available
from the command line interface and is primarily used to construct or provide
output parsible by a client.

## severity

-   **Type:** string
-   **Values:** `trace`, `info`, `warning` or `error`
-   **Default Value:** `warning`
-   **Command Line Interface:** `--severity <severity>`, `-s <severity>`

The severity of messages to display.

## shellEscape

-   **Type:** string
-   **Values:** `disabled`, `restricted`, `enabled`
-   **Default Value:** none
-   **Command Line Interface:** `--shell-escape <shellEscape>`

Enable shell escape (write18).

## synctex

-   **Type:** boolean
-   **Default Value:** `false`
-   **Command Line Interface:** `--synctex`

Generate SyncTeX annotations.

## tests

-   **Type:** string
-   **Command Line Interface:** `--tests`

Test programs to be executed during test command.

## validateCache

-   **Type:** boolean
-   **Default Value:** `true`
-   **Command Line Interface:** `--no-validate-cache`

Validate file cache generated by previous builds.

## Environment Variables

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

[build]: commands#build

[clean]: commands#clean

[cleanpatterns]: #cleanpatterns

[engine]: #engine

[job specific source files]: configuration#job-specific-source-files

[outputformat]: #outputformat

[scrub]: commands#scrub
