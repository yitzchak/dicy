\documentclass{article}

%include polycode.fmt

\begin{document}

Euclid's algorithm in Haskell.

\begin{code}
gcd :: (Integral a) => a -> a -> a
gcd 0 0 =  error "gcd 0 0 is undefined"
gcd x y =  gcd' (abs x) (abs y) where
  gcd' a 0  =  a
  gcd' a b  =  gcd' b (a `rem` b)
\end{code}

\end{document}
