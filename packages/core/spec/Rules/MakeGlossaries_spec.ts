/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import MakeGlossaries from '../../src/Rules/MakeGlossaries'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = MakeGlossaries,
  parameters = [{
    filePath: 'GlossaryControlFile.glo'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
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
