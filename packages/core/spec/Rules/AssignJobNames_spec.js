/* @flow */

import 'babel-polyfill'

import AssignJobNames from '../../src/Rules/AssignJobNames'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({ RuleClass = AssignJobNames, ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, ...rest })
}

describe('AssignJobNames', () => {
  describe('run', () => {
    it('verifies that no job names are set.', async (done) => {
      const { rule } = await initialize()
      const source = await rule.getFile(rule.options.filePath)

      expect(await rule.run()).toBe(true)

      expect(Array.from(source.jobNames.values())).toEqual([])

      done()
    })

    it('verifies that job name is attached to file.', async (done) => {
      const { rule } = await initialize({ options: { jobName: 'foo' } })
      const source = await rule.getFile(rule.options.filePath)

      expect(await rule.run()).toBe(true)

      expect(Array.from(source.jobNames.values())).toEqual(['foo'])

      done()
    })
  })
})
