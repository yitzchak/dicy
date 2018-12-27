# Changes

All significant changes to this project will be documented in the notes below.
This project adheres to [Semantic Versioning](http://semver.org/).

## [v0.15.1][] - 2018-11-07

### Fixed

-   Prevent subfiles from triggering `weaveEngine`.

## [v0.15.0][] - 2018-11-07

### Added

-   Support for metys weaver.

## [v0.14.1][] - 2018-10-31

### Fixed

-   Prevent `LoadAndValidateCache` cache from overwriting itself with cache
    version of rule.

## [v0.14.0][] - 2018-10-22

### Changed

-   LaTeX file identification now permits TeX and LaTeX commands to appear
    before `documentclass` command. Fixes [#142][].

## [v0.13.0][] - 2018-03-13

### Changed

-   LaTeX `engine` setting is now an enumeration versus a free form text value.
-   User configuration is now stored in platform specific manner which conforms
    to established norms for each platform as detailed below. Suggested and
    reviewed by [@yudai-nkt][]. Resolves [#138][].
    -   MacOS - `$XDG_CONFIG_HOME/dicy/config.yaml` or
        `$HOME/Library/Application Support/dicy/config.yaml`
    -   Windows - `$XDG_CONFIG_HOME\dicy\config.yaml`,
        `%APPDATA%\dicy\config.yaml` or
        `%USERPROFILE%\AppData\Roaming\dicy\config.yaml`
    -   Linux, BSD and all others - `$XDG_CONFIG_HOME/dicy/config.yaml` or
        `$HOME/.config/dicy/config.yaml`

## [v0.12.3][] - 2017-12-10

### Fixed

-   Add missing dependencies for @dicy/cli.

## [v0.12.2][] - 2017-12-02

### Changed

-   Output target list is now saved to cache to allow more reliability when
    copying targets to root.

## [v0.12.1][] - 2017-11-29

### Fixed

-   Cache validation no longer fails if output directory or other outputs have
    be deleted since cache was written. This fixes an issue copying targets to
    root after the output directory has been manually deleted by the user.

## [v0.12.0][] - 2017-11-25

### Added

-   Allow multiple commands to be run from command line interface.
-   `test` command and `tests` option.

### Changed

-   Continued LaTeX font messages are now combined in a single message by log
    parser.

### Fixed

-   `graph` command places `.dot` in project root instead of current directory.

## [v0.12.0-pre.0][] - 2017-11-18

### Added

-   Standardized library API and documentation for `@dicy/core` and
    `@dicy/client`.
-   JSON-RPC server and client implementing library API.

### Changed

-   Use Node Boron LTS thereby removing need for Map/Set polyfill.
-   Use TypeScript instead of Flow.
-   All events are now sent to the log as regular log events, some with severity
    level of `trace` if they are not of interest to most users.
-   Replaced `--save-events` with `--save-log` command line option since all
    events have been merged into log entry events.
-   Log events can now contain multiple log messages.
-   Primary interface to DiCy libraries is now through `BuilderCacheInterace`
    implementation instead of direct access to builder.

### Removed

-   All non log events.
-   `--console-event-output` command line option.

### Fixed

-   Regression which prevented output directory from being created.
-   Instance options set from the command line or passed to the library
    interface are now protected from cache cleaning.

## [v0.11.0][] — 2017-10-25

### Added

-   `validateCache` to control cache validation during load command \[[#99][]].
-   Improved parsing of source references in LaTeX log files \[[#103][]].

### Fixed

-   Creation of output directories across different jobs caused excessive
    directories to be created. Sub-directories of any output directory are now
    ignored, not just the current output directory. Fixes [#104][].
-   Incorrect overriding of boolean options specified in lower priority
    configuration sources by the command line interface. Fixes [#105][].
-   Incorrect identification of sub-files with `\documentclass` in a verbatim
    environment as a LaTeX main file. Fixes [#106][].

## [v0.10.1][] — 2017-09-30

### Fixed

-   Message severity in options validation incorrectly set error. Changed to
    warning severity.
-   `BibToGls` missing guard on parsed log search.

## [v0.10.0][] — 2017-09-25

### Added

-   `pweaveKernel` option to specify Jupyter kernel \[[#83][]].
-   Documentation comparing DiCy to latexmk and arara \[[#89][]]. Suggested and
    edited by [@yudai-nkt][].
-   Support for bib2gls and glossaries-extra package \[[#90][]].
-   Version field and version checking for cache loading and saving \[[#92][]].

### Changed

-   Replace `ignoreUserOptions` option with `loadUserOptions` option which has a
    default value of `true` \[[#92][]].
-   Replace `ignoreCache` option with `loadCache` and `saveCache` options both
    of which have a default value of `true` \[[#92][]].
-   Only emit `fileDeleted` event when file was actually deleted and not when
    file has been removed from in-memory cache \[[#92][]].

## [v0.9.1][] — 2017-09-04

### Fixed

-   Validation of environment variable options \[[#82][]].

## [v0.9.0][] — 2017-09-04

### Added

-   Support for PythonTeX \[[#69][]].
-   Support for Pweave \[[#71][]].
-   `knitrOutputPath` option to allow job specific output paths for knitr
    \[[#71][]].
-   `dviToPdfEngine` option to allow setting the program to use for DVI to PDF
    conversion \[[#72][]].
-   Verification of the existence of appropriate build rules \[[#77][]].

### Fixed

-   Parsing of LaTeX magic comments to allow environment variables (`$PATH`) to
    appear \[[#73][]].
-   Path globbing used in searching for log files and `clean` command on Windows
    by not normalizing path before pattern application \[[#73][]].

## [v0.8.0][] — 2017-08-15

### Added

-   Support for epstopdf.
-   Support for LaTeX engines platex and uplatex.
-   Support for BibTeX engines bibtex8, bibtexu, pbibtex and upbibtex.
-   Support for index engines texindy, mendex and upmendex.

### Fixed

-   BibTeX execution directory issues that made citations in sub-files fail to
    resolve.

## [v0.7.0][] — 2017-07-26

### Added

-   Add support for splitindex.

## [v0.6.0][] — 2017-07-16

### Added

-   Add `consoleEventOutput` option \[[#53][]].
-   Add `intermediatePostScript` and `ignoreHomeOptions` options \[[#51][]].

### Changed

-   Improved display of CLI log messages \[[#53][]].

## [v0.5.0][] — 2017-07-12

### Added

-   Improved BibTeX log parsing \[[#47][]].
-   Option to control knitr concordance \[[#49][]].
-   Support and options for literate Agda source \[[#49][]].
-   Options for literate Haskell processing \[[#49][]].
-   Improved dependency analysis for BibTex, Biber and makeindex \[[#49][]].

## [v0.4.1][] — 2017-07-04

### Fixed

-   Some incorrect asynchronous code in rules.
-   Check for job specific output formats for `dvipdfmx` and others.

## [v0.4.0][] — 2017-07-02

### Added

-   Parsing of LaTeX3 style message in log files.

### Fixed

-   Made detection of file updates more robust.

## [v0.3.2][] — 2017-06-23

### Fixed

-   Some issues with clearing of rule failure flags.

## [v0.3.1][] — 2017-06-23

### Fixed

-   Some issues with cache loading and file updates.

## [v0.3.0][] — 2017-06-23

### Added

-   Parsing of knitr concordance files and updating of source references in log
    messages.

## [v0.2.2][] — 2017-06-10

### Fixed

-   Previous rule failure no longer prevents rule evaluation if the inputs of
    the rule have changed.

## [v0.2.1][] — 2017-06-08

### Fixed

-   PatchSyncTeX rule failure causes a warning message versus causing an error
    essage to be sent. This makes a  missing patchSynctex library a non-critical
    failure.

## [v0.2.0][] — 2017-06-05

### Added

-   Scrub command \[[#21][]].
-   Ability to override environment variables \[[#23][]].
-   Kill command \[[#27][]].
-   Validation of in memory file cache \[[#30][]].

### Changed

-   Improve response to repeated rule failure \[[#27][]].

## [v0.1.0][] — 2017-04-29

### Added

-   Library API for building documents (@dicy/core).
-   Command line interface for building documents (@dicy/cli).
-   Rules for running various TeX programs such as: `asy`, `bibtex`, `biber`,
    `xdvipdfmx`, `dvips`, `dvisvgm`, `graphviz`, `knitr`, `(pdf)latex`,
    `lhs2TeX`, `makeglossaries`, `makeindex`, `mpost`, `pdf2ps`, `ps2pdf` and
    `sage`.
-   Log parsing for Asymptote, BibTeX, Biber, and LaTeX.
-   Configuration parsing in YAML or TeX magic comments.

[v0.15.1]: https://github.com/yitzchak/dicy/compare/v0.15.0...v0.15.1

[v0.15.0]: https://github.com/yitzchak/dicy/compare/v0.14.1...v0.15.0

[v0.14.1]: https://github.com/yitzchak/dicy/compare/v0.14.0...v0.14.1

[v0.14.0]: https://github.com/yitzchak/dicy/compare/v0.13.0...v0.14.0

[v0.13.0]: https://github.com/yitzchak/dicy/compare/v0.12.3...v0.13.0

[v0.12.3]: https://github.com/yitzchak/dicy/compare/v0.12.2...v0.12.3

[v0.12.2]: https://github.com/yitzchak/dicy/compare/v0.12.1...v0.12.2

[v0.12.1]: https://github.com/yitzchak/dicy/compare/v0.12.0...v0.12.1

[v0.12.0]: https://github.com/yitzchak/dicy/compare/v0.12.0-pre.0...v0.12.0

[v0.12.0-pre.0]: https://github.com/yitzchak/dicy/compare/v0.11.0...v0.12.0-pre.0

[v0.11.0]: https://github.com/yitzchak/dicy/compare/v0.10.1...v0.11.0

[v0.10.1]: https://github.com/yitzchak/dicy/compare/v0.10.0...v0.10.1

[v0.10.0]: https://github.com/yitzchak/dicy/compare/v0.9.1...v0.10.0

[v0.9.1]: https://github.com/yitzchak/dicy/compare/v0.9.0...v0.9.1

[v0.9.0]: https://github.com/yitzchak/dicy/compare/v0.8.0...v0.9.0

[v0.8.0]: https://github.com/yitzchak/dicy/compare/v0.7.0...v0.8.0

[v0.7.0]: https://github.com/yitzchak/dicy/compare/v0.6.0...v0.7.0

[v0.6.0]: https://github.com/yitzchak/dicy/compare/v0.5.0...v0.6.0

[v0.5.0]: https://github.com/yitzchak/dicy/compare/v0.4.1...v0.5.0

[v0.4.1]: https://github.com/yitzchak/dicy/compare/v0.4.0...v0.4.1d

[v0.4.0]: https://github.com/yitzchak/dicy/compare/v0.3.2...v0.4.0

[v0.3.2]: https://github.com/yitzchak/dicy/compare/v0.3.1...v0.3.2

[v0.3.1]: https://github.com/yitzchak/dicy/compare/v0.3.0...v0.3.1

[v0.3.0]: https://github.com/yitzchak/dicy/compare/v0.2.2...v0.3.0

[v0.2.2]: https://github.com/yitzchak/dicy/compare/v0.2.1...v0.2.2

[v0.2.1]: https://github.com/yitzchak/dicy/compare/v0.2.0...v0.2.1

[v0.2.0]: https://github.com/yitzchak/dicy/compare/v0.1.0...v0.2.0

[v0.1.0]: https://github.com/yitzchak/dicy/tree/v0.1.0

[#142]: https://github.com/yitzchak/dicy/issues/142

[#138]: https://github.com/yitzchak/dicy/issues/138

[#106]: https://github.com/yitzchak/dicy/issues/106

[#105]: https://github.com/yitzchak/dicy/issues/105

[#104]: https://github.com/yitzchak/dicy/issues/104

[#103]: https://github.com/yitzchak/dicy/pull/103

[#99]: https://github.com/yitzchak/dicy/pull/99

[#92]: https://github.com/yitzchak/dicy/pull/92

[#90]: https://github.com/yitzchak/dicy/pull/90

[#89]: https://github.com/yitzchak/dicy/pull/89

[#83]: https://github.com/yitzchak/dicy/pull/83

[#82]: https://github.com/yitzchak/dicy/pull/82

[#77]: https://github.com/yitzchak/dicy/pull/77

[#73]: https://github.com/yitzchak/dicy/pull/73

[#72]: https://github.com/yitzchak/dicy/pull/72

[#71]: https://github.com/yitzchak/dicy/pull/71

[#69]: https://github.com/yitzchak/dicy/pull/69

[#53]: https://github.com/yitzchak/dicy/pull/53

[#51]: https://github.com/yitzchak/dicy/pull/51

[#49]: https://github.com/yitzchak/dicy/pull/49

[#47]: https://github.com/yitzchak/dicy/pull/47

[#30]: https://github.com/yitzchak/dicy/pull/30

[#27]: https://github.com/yitzchak/dicy/pull/27

[#23]: https://github.com/yitzchak/dicy/pull/23

[#21]: https://github.com/yitzchak/dicy/pull/21

[@yudai-nkt]: https://github.com/yudai-nkt
