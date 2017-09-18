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
custom rules triggered by file extension in various `latexmkrc` files. Also,
[latexmk][] treats the `latex` rule as a special primary rule which is run
before all other rules. This makes it difficult to run preprocessing rules need
in literate programming such as knitr, lhs2TeX or Pweave before LaTeX is run.

## DiCy

Like [arara][], DiCy has an extensive set of rules including indexing,
bibliography, graphics and literate programming rules which can be individually
configured. Like [latexmk][], DiCy automatically selects the appropriate rules
to run, including the timing and frequency of each run. This means that, like
[latexmk][], in order to build a document with a BibTeX based bibliography one
need only execute the following in a command shell.

```sh
dicy build foo.tex
```

DiCy builds can be configured using command line options, using a YAML file or
using TeX Magic comments. For instance, to enable shell escape and use a custom
style with BibTeX one could use the following TeX Magic comments in the main
source file.

```latex
% !TeX shellEscape = yes
% !TeX makeindexStyle = foo
\documentclass{article}
...
```

DiCy does not treat the LaTeX rule as a primary rule and all other rules as
secondary rules. This makes it easy to support literate programming or
multistage documents. For instance, no further configuration is needed build a
knitr document. DiCy will automatically process the file with knitr, then
process the result with the usual LaTeX build pipeline.

[arara]: https://ctan.org/pkg/arara
[compilation topic]: https://ctan.org/topic/compilation
[latexmk]: https://ctan.org/pkg/latexmk
[pandoc]: https://pandoc.org/
