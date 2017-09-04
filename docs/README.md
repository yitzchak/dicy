# DiCy

A JavaScript based builder for [LaTeX][], [knitr][], [Literate Agda][],
[Literate Haskell][], and [Pweave][] that automatically builds dependencies. It
parses and filters output logs and error messages generated during build and
can build projects that utilize the following programs to process files.

-   Bibliographies &mdash; [Biber][], [BibTeX][]
-   Graphics Creation &mdash; [Asymptote][], [MetaPost][]
-   Image/File Conversion &mdash; [dvipdfm][], [dvipdfmx][], [dvips][],
    [dvisvgm][], [epstopdf][], [pdf2ps][], [ps2pdf][]
-   Indexing/Glossaries &mdash; [makeglossaries][], [makeindex][], [mendex][],
    [splitindex][], [texindy][], [upmendex][]
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
-   [Events][events]
-   [Options][options]
-   [Rules][rules]

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

| Command | Description                       |
|---------|-----------------------------------|
| build   | Build the input file              |
| clean   | Clean up after a build            |
| graph   | Graph dependencies using GraphViz |
| log     | Report log messages generated     |

[Agda]: http://wiki.portal.chalmers.se/agda/pmwiki.php
[Asymptote]: http://asymptote.sourceforge.net/
[Biber]: http://biblatex-biber.sourceforge.net/
[BibTeX]: http://www.bibtex.org/
[configuration]: configuration
[dvipdfm]: http://www.ctan.org/pkg/dvipdfm
[dvipdfmx]: http://project.ktug.org/dvipdfmx/
[dvips]: http://www.tug.org/texinfohtml/dvips.html
[dvisvgm]: http://dvisvgm.bplaced.net/
[epstopdf]: http://www.ctan.org/pkg/epstopdf
[events]: events
[knitr]: https://yihui.name/knitr/
[LaTeX]: https://www.latex-project.org/
[lhs2TeX]: http://www.andres-loeh.de/lhs2tex/
[Literate Agda]: http://wiki.portal.chalmers.se/agda/pmwiki.php?n=Main.LiterateAgda
[Literate Haskell]: https://wiki.haskell.org/Literate_programming
[makeglossaries]: http://www.ctan.org/pkg/glossaries
[makeindex]: http://www.ctan.org/pkg/makeindex
[mendex]: https://www.ctan.org/pkg/mendex
[MetaPost]: http://www.tug.org/metapost.html
[options]: options
[patchSynctex]: https://cran.r-project.org/package=patchSynctex
[pdf2ps]: http://linux.die.net/man/1/pdf2ps
[ps2pdf]: http://ghostscript.com/doc/current/Ps2pdf.htm
[Pweave]: https://github.com/mpastell/Pweave
[PythonTeX]: http://www.ctan.org/pkg/pythontex
[rules]: rules
[SageTeX]: http://www.ctan.org/tex-archive/macros/latex/contrib/sagetex/
[splitindex]: http://www.ctan.org/pkg/splitindex
[texindy]: http://xindy.sourceforge.net/
[upmendex]: http://www.ctan.org/pkg/upmendex
