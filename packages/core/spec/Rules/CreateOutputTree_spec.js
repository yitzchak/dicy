/* @flow */

import 'babel-polyfill'

import CreateOutputTree from '../../src/Rules/CreateOutputTree'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({ RuleClass = CreateOutputTree, ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, ...rest })
}

describe('CreateOutputTree', () => {
  describe('appliesToPhase', () => {
    it('returns false if outputDirectory is not set.', async (done) => {
      const { rule, options } = await initialize()

      expect(await CreateOutputTree.appliesToPhase(rule.state, 'build', 'initialize', options)).toBe(false)

      done()
    })

    it('returns false if outputDirectory is set to current directory.', async (done) => {
      const { rule, options } = await initialize({
        options: { outputDirectory: '.' }
      })

      expect(await CreateOutputTree.appliesToPhase(rule.state, 'build', 'initialize', options)).toBe(false)

      done()
    })

    it('returns true if outputDirectory is set.', async (done) => {
      const { rule, options } = await initialize({
        options: { outputDirectory: 'foo' }
      })

      expect(await CreateOutputTree.appliesToPhase(rule.state, 'build', 'initialize', options)).toBe(true)

      done()
    })
  })
})
