# Comparison of DiCy to other LaTeX Builders

There are many different automatic and semi-automatic builders for LaTeX-centric
documents. The [Compilation Topic][] at CTAN provides a current list of some of
those specifically designed for TeX or LaTeX documents. In addition there are
also generic document processing tools such as [pandoc][].

In order to explain the intention of and capabilities of DiCy this document
compares DiCy to two of the most popular builders, [arara][] and [latexmk][].

## arara

[arara][] is a rule based builder which relies on directives given in the source
file to specify what programs should be run, the order in which they should be
run, and also the frequency in which they should be run. For instance, to
compile a document that has a BibTeX based bibliography the following directives
would need to be listed at the beginning of the source document.

```latex
% arara: pdflatex
% arara: bibtex
% arara: pdflatex
% arara: pdflatex
\documentclass{article}
...
```

Any repeated calls of `pdflatex` need to be listed explicitly as [arara][] does
not detect the need to run or rerun a program, nor does it detect which rules
are applicable to the source file.

One can add new rules to [arara][] and there is an extensive set of rules
provided as part of the default installation. Additionally, many of the rules
can be customized using options in the directive. For instance, to enable shell
escape and use a custom style with BibTeX one would use the following
directives.

```latex
% arara: pdflatex: { shell: yes }
% arara: bibtex: { style: foo }
% arara: pdflatex: { shell: yes }
% arara: pdflatex: { shell: yes }
\documentclass{article}
...
```

## latexmk

[latexmk][] is rule based builder selects the appropriate programs to run
including the frequency at which those programs to run automatically and without
explicit directives. For instance, to build a document with a BibTeX based
bibliography one need only execute the following in a command shell.

```sh
latexmk -pdf foo.tex
```

Unlike [arara][], [latexmk][] uses the log files, console output and any file
listings created by LaTeX to determine which programs to run and whether
document building has been completed.

[latexmk][] focuses on a small set of common rules and offers limited
configuration of those rules, usually by allowing one to override the command
line used to call the applicable program. New rules can be added by defining
custom rules triggered by file extension in various `latexmkrc` files. Custom
rules do not have the same priority as internal rules. Specifically, [latexmk][]
treats the `latex` rule as a special primary rule which is run before all other
rules. This makes it difficult to run preprocessing rules such as knitr, lhs2TeX
or Pweave which are needed in literate programming or reproducible research
documents.

## DiCy

Like [arara][], DiCy has an extensive set of rules including indexing,
bibliography, graphics and literate programming rules which can be individually
configured. Like [latexmk][], DiCy automatically selects the appropriate rules
to run, including the timing and frequency of each run. This means that, like
[latexmk][], to build a document with a BibTeX based bibliography one need only
execute the following in a command shell.

```sh
dicy build foo.tex
```

DiCy builds can be configured using command line options, using a YAML file or
using TeX Magic comments. For instance, to enable shell escape and use a custom
style with BibTeX one could use the following TeX Magic comments in the main
source file.

```latex
%!TeX shellEscape = yes
%!TeX makeindexStyle = foo
\documentclass{article}
...
```

DiCy does not treat the LaTeX rule as a primary rule and all other rules as
secondary rules. This makes it easy to support literate programming or
multistage documents. For instance, no further configuration is needed build a
knitr document. DiCy will automatically process the file with knitr, then
process the result with the usual LaTeX build pipeline.

The automatic rule selection of DiCy is based upon log parsing, console output
and file listings, like [latexmk][]. DiCy's automatic rule is more comprehensive
then that of [latexmk][], though. For example, DiCy will automatically call the
appropriate program if one uses packages that require follow-on scripts to
process output files such as [makeindex][], [epstopdf][] or [splitindex][].

### Log Parsing and Filtering

In addition to using parsed logs for automatic rule selection, DiCy can filter
and display log messages based on message severity. For example, the following
call to DiCy will build the document then display all warning or error messages
from Asymptote, Biber, BibTeX, LaTeX, makeindex, mendex, splitindex, or xindy
logs.

```sh
dicy build,log foo.tex
```

Whereas the following call will display all messages including informational
only messages (`info` severity).

```sh
dicy bl --severity=info foo.tex
```

Log message display can be done as part of a build, or may be done after a build
has been completed since all parsed messages are stored in the build cache
`foo-cache.yaml` in this example. For instance, the following will display all
error messages.

```sh
dicy b foo.tex
dicy l -s error foo.tex
```

### Shared Configuration

DiCy loads the build configuration from external YAML option files or LaTeX
magic comments in addition to any options passed via the command line as
explained in detail in the section on [configuration][]. This makes it possible
to share the build configuration between the command line interface of DiCy and
the library interface of DiCy used in a builder such as [Atom LaTeX][]. From the
user perspective this happens automatically, so that building from [Atom
LaTeX][] via the `latex:build` command produces the same result as building from
the command line via `dicy b foo.tex`.

Since the same cache is used one can even query the parsed logs generated from
an [Atom LaTeX][] build from the command line using the methods described in the
previous section. DiCy also ensures that the in-memory cache is synchronized
with the on-disk cache.  This guarantees when building from the command line any
new rules or  dependencies created will be updated on the next build or cache
load requested by a library client such as [Atom LaTeX][].

## Program Support Across Builders

The following table is a summary of support that each builder has for common
programs used in processing LaTeX documents. In the table a closed dot (●) means
that the builder has at least minimal support for the program, an open dot (○)
means that support can be added via a custom rule or configuration option, and a
blank means that the builder is not known to support the program.

| Program                    | arara | latexmk | DiCy |
| -------------------------- | :---: | :-----: | :--: |
| Agda (literate Agda)       |       |         |   ●  |
| Asymptote                  |       |    ○    |   ●  |
| bib2gls                    |   ●   |         |      |
| Biber                      |   ●   |    ●    |   ●  |
| BibTeX                     |   ●   |    ●    |   ●  |
| BibTeX8                    |   ●   |    ○    |   ●  |
| BibTeXu                    |   ●   |    ○    |   ●  |
| dvipdfm(x)                 |   ●   |    ●    |   ●  |
| dvips                      |   ●   |    ●    |   ●  |
| dvisvgm                    |       |         |   ●  |
| epstopdf                   |       |         |   ●  |
| gnuplot                    |   ○   |         |      |
| knitr                      |       |         |   ●  |
| LaTeX                      |   ●   |    ●    |   ●  |
| lhs2TeX (literate Agda)    |       |         |   ●  |
| lhs2TeX (literate Haskell) |       |         |   ●  |
| LuaLaTeX                   |   ●   |    ●    |   ●  |
| make                       |   ●   |    ●    |      |
| makeglossaries             |   ●   |    ○    |   ●  |
| makeindex                  |   ●   |    ●    |   ●  |
| mendex                     |       |    ○    |   ●  |
| MetaPost                   |   ●   |    ○    |   ●  |
| patchSynctex               |       |         |   ●  |
| pBibTeX                    |       |    ○    |   ●  |
| pdfLaTeX                   |   ●   |    ●    |   ●  |
| pLaTeX                     |       |    ○    |   ●  |
| ps2pdf                     |   ●   |    ●    |   ●  |
| Pweave                     |       |         |   ●  |
| PythonTeX                  |   ●   |    ○    |   ●  |
| Sage                       |   ●   |    ○    |   ●  |
| songidx                    |   ●   |         |      |
| splitindex                 |       |         |   ●  |
| texindy                    |   ●   |    ○    |   ●  |
| upBibTeX                   |       |    ○    |   ●  |
| upLaTeX                    |       |    ○    |   ●  |
| upmendex                   |       |    ○    |   ●  |
| XeLaTeX                    |   ●   |    ●    |   ●  |
| xindy                      |   ●   |         |      |

[atom latex]: http://atom.io/packages/latex

[configuration]: configuration

[arara]: http://ctan.org/pkg/arara

[compilation topic]: http://ctan.org/topic/compilation

[epstopdf]: http://ctan.org/pkg/epstopdf

[latexmk]: http://ctan.org/pkg/latexmk

[makeindex]: http://ctan.org/pkg/makeindex

[pandoc]: http://pandoc.org/

[splitindex]: http://ctan.org/pkg/splitindex
