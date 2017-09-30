# Changes

All significant changes to this project will be documented in the notes below.
This project adheres to [Semantic Versioning](http://semver.org/).

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

[v0.10.1]: https://github.com/yitzchak/dicy/compare/v0.10.0...v0.10.1

[v0.10.0]: https://github.com/yitzchak/dicy/compare/v0.9.1...v0.10.0

[v0.9.1]: https://github.com/yitzchak/dicy/compare/v0.9.0...v0.9.1

[v0.9.0]: https://github.com/yitzchak/dicy/compare/v0.8.0...v0.9.0

[v0.8.0]: https://github.com/yitzchak/dicy/compare/v0.7.0...v0.8.0

[v0.7.0]: https://github.com/yitzchak/dicy/compare/v0.6.0...v0.7.0

[v0.6.0]: https://github.com/yitzchak/dicy/compare/v0.5.0...v0.6.0

[v0.5.0]: https://github.com/yitzchak/dicy/compare/v0.4.1...v0.5.0

[v0.4.1]: https://github.com/yitzchak/dicy/compare/v0.4.0...v0.4.1

[v0.4.0]: https://github.com/yitzchak/dicy/compare/v0.3.2...v0.4.0

[v0.3.2]: https://github.com/yitzchak/dicy/compare/v0.3.1...v0.3.2

[v0.3.1]: https://github.com/yitzchak/dicy/compare/v0.3.0...v0.3.1

[v0.3.0]: https://github.com/yitzchak/dicy/compare/v0.2.2...v0.3.0

[v0.2.2]: https://github.com/yitzchak/dicy/compare/v0.2.1...v0.2.2

[v0.2.1]: https://github.com/yitzchak/dicy/compare/v0.2.0...v0.2.1

[v0.2.0]: https://github.com/yitzchak/dicy/compare/v0.1.0...v0.2.0

[v0.1.0]: https://github.com/yitzchak/dicy/tree/v0.1.0

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
