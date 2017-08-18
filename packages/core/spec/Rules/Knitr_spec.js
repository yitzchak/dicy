/* @flow */

import 'babel-polyfill'

import Knitr from '../../src/Rules/Knitr'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: Knitr,
    parameters: [{
      filePath: 'RNoWeb.Rnw'
    }],
    options
  })
}

describe('Knitr', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for Rnw file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(knitr);opts_knit$set(concordance=TRUE);knit(\'RNoWeb.Rnw\',\'RNoWeb.tex\')'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex', '$DIR_0/$NAME_0-concordance.tex']
      })

      done()
    })

    it('returns correct arguments and command options for Rnw file when concordance is off.', async (done) => {
      const { rule } = await initialize({ knitrConcordance: false })

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(knitr);knit(\'RNoWeb.Rnw\',\'RNoWeb.tex\')'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex']
      })

      done()
    })
  })
})
