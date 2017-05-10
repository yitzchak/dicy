# Options

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

## copyTargetsToRoot

-   **Type:** boolean
-   **Default Value:** `false`
-   **Commands:** [build][]
-   **Command Line Interface:**  `--copy-targets-to-root`

If [copyTargetsToRoot][] is `true` and [outputDirectory][] is not `.` for the
current job then the rule [CopyTargetsToRoot][] will copy each generated output
file to the directory that contains the source file. The original file will be
preserved so that the dependency tree will not be broken.

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

## disableRules

-   **Type:** array of strings
-   **Default Value:** none
-   **Commands:** all
-   **Command Line Interface:**  `--disable-rules <disableRules>`

Disable specific rules when processing.

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

## saveEvents

-   **Type:** array of strings
-   **Values:** `action`, `command`, `fileAdded`, `fileChanged`, `fileDeleted`,
    `fileRemoved`, `inputAdded`, `log`, or `outputAdded`
-   **Default Value:** none
-   **Commands:** all
-   **Command Line Interface:** `--save-events <saveEvents>`

Save a transcript of received events to `$NAME-events.yaml`. This options is
only available from the command line interface and is primarily used to
construct tests.

## severity

-   **Type:** string
-   **Values:** `trace`, `info`, `warning` or `error`
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

[action]: events#action
[build]: commands#build
[clean]: commands#clean
[copyTargetsToRoot]: #copytargetstoroot
[DviToPdf]: rules#dvitopdf
[engine]: #engine
[Job Specific Source Files]: configuration#job-specific-source-files
[LaTeX]: rules#latex
[outputDirectory]: #outputdirectory
[outputFormat]: #outputformat
[severity]: #severity