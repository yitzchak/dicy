/* @flow */

import 'babel-polyfill'

import Knitr from '../../src/Rules/Knitr'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Knitr,
  filePath = 'file-types/RNoWeb.Rnw',
  parameters = [{
    filePath: 'RNoWeb.Rnw'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, filePath, parameters, ...rest })
}

describe('Knitr', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for Rnw file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(knitr);opts_knit$set(concordance=TRUE);knit(\'RNoWeb.Rnw\',\'RNoWeb.tex\')'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$JOB.tex', '$JOB-concordance.tex']
      })

      done()
    })

    it('returns correct arguments and command options for Rnw file when concordance is off.', async (done) => {
      const { rule } = await initialize({
        options: { knitrConcordance: false }
      })

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(knitr);knit(\'RNoWeb.Rnw\',\'RNoWeb.tex\')'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$JOB.tex']
      })

      done()
    })

    it('returns correct arguments and command options for Rnw file when knitrOutputPath is set.', async (done) => {
      const { rule } = await initialize({
        options: { knitrOutputPath: 'foo.tex' }
      })

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(knitr);opts_knit$set(concordance=TRUE);knit(\'RNoWeb.Rnw\',\'foo.tex\')'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['foo.tex', 'foo-concordance.tex']
      })

      done()
    })
  })
})
