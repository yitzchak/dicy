# Ouroboros

[![Build Status][travis svg]][travis]
[![Windows Build Status][appveyor svg]][appveyor]
[![Dependency Status][dependency svg]][dependency]
[![devDependency Status][devDependency svg]][devDependency]
[![Greenkeeper Status][greenkeeper svg]][greenkeeper]

A JavaScript based builder for LaTeX, knitr and literate Haskell that
automatically builds dependencies. Can automatically process projects that
utilize Asymptote, Biber, BibTeX, dvitopdf, MetaPost, makeindex, makeglossaries,
or SageTeX. Also, parses and filters output logs and error messages generated
during build.

## Installation

Ouroboros can be used either as a library or via the command line. To install
Ouroboros as a library use `npm install ouroboros`. To install for command line
access use `npm install -g ouroboros-cli`.

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
ouroboros [command] [options] [inputs...]
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

The primary class for usage is the `Ouroboros` class. The library requires a
polyfill for `Set`/`Map` usage such as `babel-polyfill`. For instance, to build
`foo.tex` and report any log messages:

```javascript
import 'babel-polyfill'
import { Ouroboros } from 'ouroboros'

const builder = await Ouroboros.create('foo.tex', { synctex: true })

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

[appveyor svg]: https://ci.appveyor.com/api/projects/status/s3unjr8c90bhcd99?svg=true
[appveyor]: https://ci.appveyor.com/project/yitzchak/ouroboros/branch/master
[commands]: https://yitzchak.github.io/ouroboros/commands
[configuration]: https://yitzchak.github.io/ouroboros/configuration
[dependency svg]: https://david-dm.org/yitzchak/ouroboros.svg
[dependency]: https://david-dm.org/yitzchak/ouroboros
[devDependency svg]: https://david-dm.org/yitzchak/ouroboros/dev-status.svg
[devDependency]: https://david-dm.org/yitzchak/ouroboros?type=dev
[events]: https://yitzchak.github.io/ouroboros/events
[greenkeeper svg]: https://badges.greenkeeper.io/yitzchak/ouroboros.svg
[greenkeeper]: https://greenkeeper.io/
[options]: https://yitzchak.github.io/ouroboros/options
[rules]: https://yitzchak.github.io/ouroboros/rules
[travis svg]: https://travis-ci.org/yitzchak/ouroboros.svg?branch=master
[travis]: https://travis-ci.org/yitzchak/ouroboros
