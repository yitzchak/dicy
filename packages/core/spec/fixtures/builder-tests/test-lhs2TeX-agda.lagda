%!TeX literateAgdaEngine = lhs2TeX
%!TeX jobNames = job-1, job-2
%!TeX job-2:outputDirectory = output
%!TeX check = lhs2TeX -V
\documentclass{article}

\def\textmu{}

%include agda.fmt

\begin{document}

The identity function:

\begin{code}
id : {S : Set} -> S -> S
id {S} x = x
\end{code}

\end{document}
