/* @flow */

import 'babel-polyfill'

import Agda from '../../src/Rules/Agda'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Agda,
  parameters = [{
    filePath: 'LiterateAgda.lagda'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('Agda', () => {
  describe('appliesToParameters', () => {
    it('returns true if literateAgdaEngine is \'agda\'', async (done) => {
      const { rule, options } = await initialize()

      expect(await Agda.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if literateAgdaEngine is not \'agda\'', async (done) => {
      const { rule, options } = await initialize({
        options: { literateAgdaEngine: 'lhs2TeX' }
      })

      expect(await Agda.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

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
        outputs: ['$DIR_0/$NAME_0.tex', '$DIR_0/$NAME_0.agdai', '$DIR_0/agda.sty']
      })

      done()
    })
  })
})
