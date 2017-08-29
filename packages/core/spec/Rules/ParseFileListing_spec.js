/* @flow */

import 'babel-polyfill'
import path from 'path'

import File from '../../src/File'
import ParseFileListing from '../../src/Rules/ParseFileListing'
import { initializeRule } from '../helpers'

import type { ParsedLog } from '../../src/types'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = ParseFileListing,
  parameters = [{
    filePath: 'FileListing.fls'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('ParseFileListing', () => {
  it('verifies that file listing is successfully parsed.', async (done) => {
    const { rule } = await initialize()
    const expectedLog: ParsedLog = {
      calls: [],
      inputs: [
        '/home/tburton/Documents/git/dicy/spec/fixtures/file-types/LaTeX.tex',
        '/home/tburton/Documents/git/dicy/spec/fixtures/file-types/output/biber.aux',
        '/usr/local/texlive/2016/texmf-dist/fonts/map/fontname/texfonts.map',
        '/usr/local/texlive/2016/texmf-dist/fonts/tfm/public/cm/cmbx10.tfm',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/oberdiek/etexcmds.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/oberdiek/ifluatex.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/oberdiek/ifpdf.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/oberdiek/infwarerr.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/oberdiek/kvsetkeys.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/oberdiek/ltxcmds.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/oberdiek/pdftexcmds.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/xstring/xstring.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/generic/xstring/xstring.tex',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/base/article.cls',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/base/ifthen.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/base/size10.clo',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/bbx/numeric.bbx',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/bbx/standard.bbx',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/biblatex.cfg',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/biblatex.def',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/biblatex.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/blx-compat.def',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/blx-dm.def',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/cbx/numeric.cbx',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/biblatex/lbx/english.lbx',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/etoolbox/etoolbox.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/graphics/keyval.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/logreq/logreq.def',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/logreq/logreq.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/oberdiek/kvoptions.sty',
        '/usr/local/texlive/2016/texmf-dist/tex/latex/url/url.sty',
        '/usr/local/texlive/2016/texmf-dist/web2c/texmf.cnf',
        '/usr/local/texlive/2016/texmf-var/web2c/pdftex/latex.fmt',
        '/usr/local/texlive/2016/texmf.cnf'
      ].map(filePath => rule.normalizePath(path.resolve(rule.rootPath, filePath))),
      outputs: [
        '/home/tburton/Documents/git/dicy/spec/fixtures/file-types/output/biber.aux',
        '/home/tburton/Documents/git/dicy/spec/fixtures/file-types/output/biber.bcf',
        '/home/tburton/Documents/git/dicy/spec/fixtures/file-types/output/biber.dvi',
        '/home/tburton/Documents/git/dicy/spec/fixtures/file-types/output/biber.log',
        '/home/tburton/Documents/git/dicy/spec/fixtures/file-types/output/biber.run.xml'
      ].map(filePath => rule.normalizePath(path.resolve(rule.rootPath, filePath))),
      messages: []
    }

    await rule.parse()

    const parsedFileListing: ?File = await rule.getFile('FileListing.fls-ParsedFileListing')

    expect(parsedFileListing).toBeDefined()
    if (!parsedFileListing) return

    expect(parsedFileListing.value).toEqual(expectedLog)

    done()
  })
})
