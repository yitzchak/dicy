/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import Knitr from '../../src/Rules/Knitr'

describe('LhsToTeX', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: Knitr

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreUserOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'Knitr.Rnw'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new Knitr(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('constructCommand', () => {
    it('returns correct arguments and command options for Rnw file.', async (done) => {
      await initialize(['Knitr.Rnw'])

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(knitr);opts_knit$set(concordance=TRUE);knit(\'Knitr.Rnw\')'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex', '$DIR_0/$NAME_0-concordance.tex']
      })

      done()
    })

    it('returns correct arguments and command options for Rnw file when concordance is off.', async (done) => {
      await initialize(['Knitr.Rnw'], { knitrConcordance: false })

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(knitr);knit(\'Knitr.Rnw\')'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex']
      })

      done()
    })
  })
})
