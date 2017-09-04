# DiCy

[![Build Status][travis svg]][travis]
[![Windows Build Status][appveyor svg]][appveyor]
[![Dependency Status][dependency svg]][dependency]
[![devDependency Status][devDependency svg]][devDependency]
[![Greenkeeper Status][greenkeeper svg]][greenkeeper]

A JavaScript based builder for [LaTeX][], [knitr][], [Literate Agda][],
[Literate Haskell][], and [Pweave][] that automatically builds dependencies. It
parses and filters output logs and error messages generated during build and
can build projects that utilize the following programs to process files.

-   Bibliographies &mdash; [Biber][], [BibTeX][], [BibTeX8][], BibTeXu,
    [pBibTeX][], [upBibTeX][]
-   Graphics Creation &mdash; [Asymptote][], [MetaPost][]
-   Image/File Conversion &mdash; [dvipdfm][], [dvipdfmx][], [dvips][],
    [dvisvgm][], [epstopdf][], [pdf2ps][], [ps2pdf][]
-   Indexing/Glossaries &mdash; [makeglossaries][], [makeindex][], [mendex][],
    [splitindex][], [texindy][], [upmendex][]
-   LaTeX Engines &mdash; [LaTeX][], [LuaLaTeX][], [pdfLaTeX][], [pLaTeX][],
    [upLaTeX][], [XeLaTeX][]
-   Literate Programming/Reproducible Research &mdash; [Agda][], [knitr][],
    [lhs2TeX][], [patchSynctex][], [PythonTeX][], [Pweave][], [SageTeX][]

## Installation

DiCy can be used either as a library or via the command line. To install DiCy as
a library use `npm install @dicy/core`. To install for command line access use
`npm install -g @dicy/cli`.

## Documentation

Basic usage of the Command Line interface and library can be found below. For
more detailed documentation please see the following pages.

-   [Configuration][configuration]
-   [Options][options]
-   [Commands][commands]
-   [Rules][rules]
-   [Events][events]

## Command Line Usage

The command line interface is generally called via

```bash
dicy [command] [options] [inputs...]
```

where the following commands are available (`--help` will enumerate options):

| Command         | Alias | Description                                                         |
|:----------------|:-----:|---------------------------------------------------------------------|
| build           | b     | Build the inputs.                                                   |
| clean           | c     | Clean up after a previous build.                                    |
| scrub           | s     | Clean up after a previous build and remove all generated files.     |
| log             | l     | Report messages from any logs.                                      |
| graph           | g     | Create a dependency graph from a previous build.                    |
| build,clean     | bc    | Build the inputs and then clean up.                                 |
| build,log       | bl    | Build the inputs and report messages from any logs.                 |
| build,log,clean | blc   | Build the inputs, report messages from any logs, and then clean up. |
| rules           |       | List available rules.                                               |

The [options][] that can be specified are generally the same options accessible
via the library interface.

## Library Usage

The primary class for usage is the `DiCy` class. The library requires a
polyfill for `Set`/`Map` usage such as `babel-polyfill`. For instance, to build
`foo.tex` and report any log messages:

```javascript
import 'babel-polyfill'
import { DiCy } from '@dicy/core'

const builder = await DiCy.create('foo.tex', { synctex: true })

builder.on('log', event => {
  const nameText = event.name ? `[${event.name}] ` : ''
  const typeText = event.category ? `${event.category}: ` : ''
  const text = `${event.severity} ${nameText}${typeText}${event.text.replace('\n', ' ')}`
  console.log(text)
})

await builder.run('load', 'build', 'log', 'save')
```

Any sequence of commands listed below may be used, but the first and last commands should
always be `load` and `save`, respectively.

| Command | Description                                                     |
|---------|-----------------------------------------------------------------|
| build   | Build the input file                                            |
| clean   | Clean up after a build                                          |
| scrub   | Clean up after a previous build and remove all generated files. |
| graph   | Graph dependencies using GraphViz                               |
| log     | Report log messages generated                                   |

[Agda]: http://wiki.portal.chalmers.se/agda/pmwiki.php
[appveyor svg]: https://ci.appveyor.com/api/projects/status/s3unjr8c90bhcd99?svg=true
[appveyor]: https://ci.appveyor.com/project/yitzchak/dicy/branch/master
[Asymptote]: http://asymptote.sourceforge.net/
[Biber]: http://biblatex-biber.sourceforge.net/
[BibTeX]: http://www.bibtex.org/
[BibTeX8]: http://www.ctan.org/pkg/bibtex8bit
[commands]: https://yitzchak.github.io/dicy/commands
[configuration]: https://yitzchak.github.io/dicy/configuration
[dependency svg]: https://david-dm.org/yitzchak/dicy.svg
[dependency]: https://david-dm.org/yitzchak/dicy
[devDependency svg]: https://david-dm.org/yitzchak/dicy/dev-status.svg
[devDependency]: https://david-dm.org/yitzchak/dicy?type=dev
[dvipdfm]: http://www.ctan.org/pkg/dvipdfm
[dvipdfmx]: http://project.ktug.org/dvipdfmx/
[dvips]: http://www.tug.org/texinfohtml/dvips.html
[dvisvgm]: http://dvisvgm.bplaced.net/
[epstopdf]: http://www.ctan.org/pkg/epstopdf
[events]: https://yitzchak.github.io/dicy/events
[greenkeeper svg]: https://badges.greenkeeper.io/yitzchak/dicy.svg
[greenkeeper]: https://greenkeeper.io/
[knitr]: https://yihui.name/knitr/
[LaTeX]: https://www.latex-project.org/
[lhs2TeX]: http://www.andres-loeh.de/lhs2tex/
[Literate Agda]: http://wiki.portal.chalmers.se/agda/pmwiki.php?n=Main.LiterateAgda
[Literate Haskell]: https://wiki.haskell.org/Literate_programming
[LuaLaTeX]: http://www.luatex.org/
[makeglossaries]: http://www.ctan.org/pkg/glossaries
[makeindex]: http://www.ctan.org/pkg/makeindex
[mendex]: https://www.ctan.org/pkg/mendex
[MetaPost]: http://www.tug.org/metapost.html
[options]: https://yitzchak.github.io/dicy/options
[patchSynctex]: https://cran.r-project.org/package=patchSynctex
[pBibTeX]: http://www.ctan.org/pkg/pbibtex-base
[pdf2ps]: http://linux.die.net/man/1/pdf2ps
[pdfLaTeX]: http://www.tug.org/applications/pdftex/
[pLaTeX]: http://www.ctan.org/pkg/platex
[ps2pdf]: http://ghostscript.com/doc/current/Ps2pdf.htm
[Pweave]: https://github.com/mpastell/Pweave
[PythonTeX]: http://www.ctan.org/pkg/pythontex
[rules]: https://yitzchak.github.io/dicy/rules
[SageTeX]: http://www.ctan.org/tex-archive/macros/latex/contrib/sagetex/
[splitindex]: http://www.ctan.org/pkg/splitindex
[texindy]: http://xindy.sourceforge.net/
[travis svg]: https://travis-ci.org/yitzchak/dicy.svg?branch=master
[travis]: https://travis-ci.org/yitzchak/dicy
[upBibTeX]: http://www.t-lab.opal.ne.jp/tex/uptex_en.html
[upLaTeX]: http://www.ctan.org/pkg/uplatex
[upmendex]: http://www.ctan.org/pkg/upmendex
[XeLaTeX]: http://xetex.sourceforge.net/
