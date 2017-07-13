%!TeX jobNames = job-1, job-2
%!TeX job-2:outputDirectory = output
%!TeX check = agda -V
\documentclass{article}

\usepackage{agda}

\begin{document}

The identity function:

\begin{code}
id : {S : Set} -> S -> S
id {S} x = x
\end{code}

\end{document}
