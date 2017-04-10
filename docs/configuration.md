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
configuration sources are detailed in the [Options](options) page,
with the exception of job name specific options which is detailed in the
[Multiple Jobs](#multiple-jobs) section.

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

will output `bar.pdf` instead of `foo.pdf`. This can be accomplished in
Ouroboros by using the [jobName](options#jobName) option. For example, using
LaTeX magic comments

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
names via the [jobNames](options#jobNames) option.

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
job names via the [jobNames](options#jobNames) option.

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

Jobs may override the source file path by using the [filePath](options#filePath) option. This not
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
    filePath: bar.asy
```

This will compile `foo.tex` to `foo.pdf` and also use Asymptote to process `bar.asy`. Jobs that override the `filePath` will be executed before jobs that do not. This
is done in case the job creates a dependency for the main source file.
