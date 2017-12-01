/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/@types/jasmine-expect/index.d.ts" />

import Agda from '../../src/Rules/Agda'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Agda,
  parameters = [{
    filePath: 'LiterateAgda.lagda'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('Agda', () => {
  describe('isApplicable', () => {
    it('returns true if literateAgdaEngine is \'agda\'', async (done) => {
      const { rule } = await initialize()

      expect(await Agda.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if literateAgdaEngine is not \'agda\'', async (done) => {
      const { rule } = await initialize({
        options: { literateAgdaEngine: 'lhs2TeX' }
      })

      expect(await Agda.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for lagda file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['agda', '--latex', '--latex-dir=.', '{{$BASE_0}}'],
        cd: '$ROOTDIR/$DIR_0',
        severity: 'error',
        outputs: [
          { file: '$DIR_0/$NAME_0.tex' },
          { file: '$DIR_0/$NAME_0.agdai' },
          { file: '$DIR_0/agda.sty' }
        ]
      })

      done()
    })
  })
})
