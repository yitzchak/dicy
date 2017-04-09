# Configuration

During the `load` command Ouroboros configures the build environment based on
the options provided directly to the builder and those provided in various
configuration files. These options are applied the following specific order.

1.  YAML options file named `.ouroboros.yaml` found in user's home directory.
2.  YAML options file named `ouroboros.yaml` found in the directory of the main
    source file.
3.  YAML options file with same name as the main source file but with `.yaml`
    extension.
4.  LaTeX magic comments found in main source file if the source file is a LaTeX
    derived format such as LaTeX, knitr, or Literate Haskell.
5.  Options provided directly to the builder or command line interface.

The various options that may be provide to Ouroboros via each of these
configuration sources are detailed in the [Options](#options) section below,
with the exception of job name specific options which is detailed in the
[Multiple Jobs][#multiple-jobs] section.

# Multiple Jobs

Ouroboros can run LaTeX multiple times on the same source file with different
job names and can also have job specific settings which include the ability to
build jobs that depend on source files other than the main source file. These
abilities are accomplished through the `jobNames` and the `jobs` options.

Modern LaTeX engines provide a command line option `jobname` which can be used
to specify the output file name as different from the input source name. For instance,
executing

```bash
pdflatex -jobname=bar foo.tex
```

will output `bar.pdf` instead of `foo.pdf`. This can be accomplished in Ouroboros
by using the `jobName` option. For example, using LaTeX magic comments

```latex
%!TeX jobName = bar
\documentclass{article}
\begin{document}
Wibble, wibble, wibble!
\end{document}
```

or using a YAML file `foo.yaml`

```yaml
jobName: bar
```

Ouroboros also provides the ability to execute multile jobs with different job
names via the `jobNames` option.

```latex
%!TeX jobNames = bar, quux, gronk
\documentclass{article}
\begin{document}
Wibble, wibble, wibble!
\end{document}
```
or via YAML

```yaml
jobNames:
  - bar
  - quux
  - gronk
```

### Job Specific Options

Each separate job can has specific options via the `jobs` option. For example,
via YAML the following will enable SyncTeX for the `quux` job, enable shell
escape for the `gronk` job while using restricted shell escape for the other
jobs.

```yaml
shellEscape: restricted
jobNames:
  - bar
  - quux
  - gronk
jobs:
  quux:
    synctex: true
  gronk:
    shellEscape: enable
```

Using LaTeX magic comments this is accomplished by prefixing the job specific
option with the job name followed by a colon.

```latex
%!TeX shellEscape = restricted
%!TeX jobNames = bar, quux, gronk
%!TeX quux:synctex = yes
%!TeX gronk:shellEscape = enable
\documentclass{article}
\begin{document}
Wibble, wibble, wibble!
\end{document}
```

In the case of YAML specified options, the job names and job specific options
can be specified using only the `jobs` option, versus explicitly specifying the
job names via the `jobNames` option.

```yaml
shellEscape: restricted
jobs:
  bar: {}
  quux:
    synctex: true
  gronk:
    shellEscape: enable
```

### Job Specific Source Files

Jobs may override the source file path by using the `fileName` option. This not
intended as a way to create a "batch" compiler, but as a way to build dependencies
that are not automatically generated when the main source file is processed
by the appropriate rule such as `LaTeX`, `Knitr`, etc.

For instance, the following LaTeX source file will create the appropriate
Asymptote source files and Ouroboros will automatically call Asymptote to
proess those source files without any user configuration.

```latex
\documentclass{article}
\usepackage[inline]{asymptote}
\begin{document}
\begin{asy}
  import math;

  size(100,0);

  pair z4=(0,0);
  pair z7=(2,0);
  pair z1=point(rotate(60)*(z4--z7),1);

  draw(z4--z7--z1--cycle);
\end{asy}
\end{document}
```

Some users prefer to place the Asymptote code in a separate file and use `\includegraphics` to place the result. In that case the following YAML could
be used to configure the job.

```yaml
jobs:
  foo: {}
  bar:
    fileName: bar.asy
```

This will compile `foo.tex` to `foo.pdf` and also use Asymptote to process `bar.asy`. Jobs that override the `filePath` will be executed before jobs that do not. This
is done in case the job creates a dependency for the main source file.

# Options

## cleanPatterns

* Type: array of strings
* Default Value: `$OUTDIR/$JOB!($OUTEXT|.synctex.gz|.tex)`, `/$OUTDIR/_minted-$JOB/*`
* Commands: clean

A list of file glob patterns to use when executing a clean command. Each glob
pattern uses following syntax:

- Typical glob patterns, like `**/*`, `foo/bar/*.pdf`.
- Brace Expansion, like `foo/bar-{1..5}.tex` or `one/{two,three}/four.Rnw`.
- Logical OR, like `foo/bar/(abc|xyz).js`
- Regular Expression character classes, like `foo/bar/baz-[1-5].tex`
- POSIX bracket expressions, like `**/[[:alpha:][:digit:]]/*`
- Quantifiers, like `?(quux|bar)` or `+(quux|bar)`. `?` matches zero or one
  patterns, `*` matches zero or more patterns, `+` matches one or more patterns,
  `@` matches exactly one pattern, and `!` match anything but given patterns.
- Value of environment variable using shell variable form (`$VAR` or `${VAR}`)
  or the following job variables.
  <dl>
    <dt>`$BASE`</dt>
    <dd>File name of current source file.</dd>

    <dt>`$DIR`</dt>
    <dd>Directory of current source file.</dd>

    <dt>`$EXT`</dt>
    <dd>Extension of current source file.</dd>

    <dt>`$JOB`</dt>
    <dd>Current job name or base name of source file if no job name is
    used.</dd>

    <dt>`$NAME`</dt>
    <dd>File name of current source file with extension.</dd>

    <dt>`$OUTDIR`</dt>
    <dd>Current output directory or `.` if no output directory has been
    specified.</dd>

    <dt>`$OUTEXT`</dt>
    <dd>File extension associated with output format.</dd>

    <dt>`$ROOTDIR`</dt>
    <dd>Directory of current main source file.</dd>
  </dl>

Patterns that begin with a slash or a backslash (`/` or `\`) are interpreted as
a file system glob pattern with the directory of the main source file as the
root directory. For instance, if the main source file path is `/foo/bar.tex` and
the pattern is `/gronk/*` then resulting pattern `/foo/gronk/*` will be used to
search for files or directories to remove during clean.

Patterns that do not begin with a slash or a backslash are interpreted as a
generated file glob pattern and will only match files explicity created by a
rule during a command such as `build`. For instance, `**/*.aux` will cause any
auxilary files created by the `LaTeX` rule to be removed during clean.

## copyTargetsToRoot

<dl>
  <dt>Type</dt>
  <dd>boolean</dd>

  <dt>Default Value</dt>
  <dd>`false`</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

If `copyTargetsToRoot` is true and `outputDirectory` is not `.` for the current
job then the rule `CopyTargetsToRoot` copy each generated output file to the
directory that contains the source file.

## deepClean

<dl>
  <dt>Type</dt>
  <dd>boolean</dd>

  <dt>Default Value</dt>
  <dd>`false`</dd>

  <dt>Commands</dt>
  <dd>`clean`</dd>
</dl>

If `deepClean` is `true` then all generated files will be removed regardless of
the value of [`cleanPatterns`](#cleanPatterns). This is equivalent to appending
`**/*` to [`cleanPatterns`](#cleanPatterns). Additionally, if the `clean`
command results in the outputs of all rules being deleted then the cache file
will be removed.

## engine

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Default Value</dt>
  <dd>`pdflatex`</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

The LaTeX engine to use when applying the `LaTeX` rule, e.g. latex, pdflatex or uplatex.

## filePath

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Default Value</dt>
  <dd>none</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

Override the master source file path for a specific job.

## ignoreRules

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Default Value</dt>
  <dd>`pdflatex`</dd>

  <dt>Commands</dt>
  <dd>all</dd>
</dl>

Ignore specific rules when processing.

## ignoreCache

<dl>
  <dt>Type</dt>
  <dd>boolean</dd>

  <dt>Default Value</dt>
  <dd>`false`</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

Ignore file cache generated by previous builds.

## jobName

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Default Value</dt>
  <dd>none</dd>

  <dt>Commands</dt>
  <dd>all</dd>
</dl>

Job name used for latex.

## job-names

<dl>
  <dt>Type</dt>
  <dd>array of strings</dd>

  <dt>Default Value</dt>
  <dd>none</dd>

  <dt>Commands</dt>
  <dd>all</dd>
</dl>

Job names used for latex.

## phaseCycles

<dl>
  <dt>Type</dt>
  <dd>number</dd>

  <dt>Default Value</dt>
  <dd>20</dd>

  <dt>Commands</dt>
  <dd>all</dd>
</dl>

Maximum number of evaluation cycles in each phase.

## outputDirectory

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Default Value</dt>
  <dd>none</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

Name of directory for output files.

## outputFormat

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Allowed Values</dt>
  <dd>`dvi`, `pdf`, `ps` or `svg`</dd>

  <dt>Default Value</dt>
  <dd>`pdf`</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

Output format of main generated file.

## severity

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Allowed Values</dt>
  <dd>`trace`, `info`, `warning` or `error`</dd>

  <dt>Default Value</dt>
  <dd>`warning`</dd>

  <dt>Commands</dt>
  <dd>all</dd>
</dl>

The severity of messages to display.

## shellEscape

<dl>
  <dt>Type</dt>
  <dd>string</dd>

  <dt>Allowed Values</dt>
  <dd>`disable`, `restricted`, `enable`</dd>

  <dt>Default Value</dt>
  <dd>none</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

Enable shell escape (write18).

## synctex

<dl>
  <dt>Type</dt>
  <dd>boolean</dd>

  <dt>Default Value</dt>
  <dd>`false`</dd>

  <dt>Commands</dt>
  <dd>`build`</dd>
</dl>

Generate SyncTeX annotations.
