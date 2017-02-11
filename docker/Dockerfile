FROM ubuntu:14.04
RUN apt-get -y update
RUN apt-get -y install software-properties-common
RUN sudo sh -c 'echo "deb http://cran.rstudio.com/bin/linux/ubuntu trusty/" >> /etc/apt/sources.list'
RUN gpg --keyserver keyserver.ubuntu.com --recv-key E084DAB9
RUN gpg -a --export E084DAB9 | sudo apt-key add -
RUN apt-add-repository -y ppa:aims/sagemath
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install build-essential libssl-dev curl git texlive-latex-base texlive-latex-recommended texlive-latex-extra texlive-bibtex-extra texlive-metapost texlive-xetex biber feynmf python-pygments latex-xcolor asymptote r-recommended sagemath-upstream-binary
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
RUN mkdir -p ~/R/library
RUN Rscript -e "install.packages(c('knitr', 'patchSynctex'), repos = 'http://cran.r-project.org')"
COPY ouroboros-test ~/ouroboros-test
ENTRYPOINT ["~/ouroboros-test"]
