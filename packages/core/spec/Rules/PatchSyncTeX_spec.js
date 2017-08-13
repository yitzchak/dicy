/* @flow */

import 'babel-polyfill'

import PatchSyncTeX from '../../src/Rules/PatchSyncTeX'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: PatchSyncTeX,
    parameters: [{
      filePath: 'Knitr.Rnw'
    }, {
      filePath: 'SyncTeX.synctex.gz'
    }, {
      filePath: 'KnitrConcordance-concordance.tex'
    }],
    options
  })
}

describe('PatchSyncTeX', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['Rscript', '-e', 'library(patchSynctex);patchSynctex(\'Knitr.Rnw\',syncfile=\'SyncTeX\')'],
        cd: '$ROOTDIR',
        severity: 'warning',
        outputs: ['$DIR_1/BASE_1']
      })

      done()
    })
  })
})
