# ouroboros
[![Build Status][travis svg]][travis]

An experimental builder for LaTeX...not ready for production use.

[travis]: https://travis-ci.org/yitzchak/ouroboros
[travis svg]: https://travis-ci.org/yitzchak/ouroboros.svg?branch=master

## Installation

```shell
npm install -g yitzchak/ouroboros
```

## Usage

Ouroboros can be used either as a library or via the command line. From the
shell the current commands are available (`--help` will enumerate options):

- `ouroboros build [options] <file>` - Build the file specified.
- `ouroboros report [options] <file>` - Display the log messages from a previous
  build.
