/* @flow */

import 'babel-polyfill'

import MakeGlossaries from '../../src/Rules/MakeGlossaries'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: MakeGlossaries,
    parameters: [{
      filePath: 'GlossaryControlFile.glo'
    }],
    options
  })
}

describe('MakeGlossaries', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for glossary file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['makeglossaries', 'GlossaryControlFile'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: [
          '$DIR_0/$NAME_0.acr',
          '$DIR_0/$NAME_0.alg',
          '$DIR_0/$NAME_0.gls',
          '$DIR_0/$NAME_0.glg'
        ]
      })

      done()
    })
  })
})
