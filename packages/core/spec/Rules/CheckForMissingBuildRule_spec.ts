/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import 'babel-polyfill'

import CheckForMissingBuildRule from '../../src/Rules/CheckForMissingBuildRule'
import Rule from '../../src/Rule'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = CheckForMissingBuildRule,
  parameters = [{
    filePath: 'LaTeX_article.tex'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('CheckForMissingBuildRule', () => {
  describe('isApplicable', () => {
    it('returns true if the parameter is the main source file.', async (done) => {
      const { dicy, rule, options } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }]
      })

      expect(await CheckForMissingBuildRule.isApplicable(dicy.state, 'build', 'execute', options, rule.parameters)).toBe(true)

      done()
    })

    it('returns false if the parameter is not the main source file.', async (done) => {
      const { dicy, rule, options } = await initialize({
        parameters: [{
          filePath: 'LaTeX_standalone.tex'
        }]
      })

      expect(await CheckForMissingBuildRule.isApplicable(dicy.state, 'build', 'execute', options, rule.parameters)).toBe(false)

      done()
    })
  })

  describe('run', () => {
    it('run succeeds and does not log any error messages when build rules are present.', async (done) => {
      const { dicy, rule, options } = await initialize()
      const file = await dicy.getFile('LaTeX_article.tex')
      if (file) {
        const otherRule = new Rule(rule.state, 'build', 'execute', options, [file])

        dicy.addRule(otherRule)

        expect(await rule.run()).toBe(true)
        expect(rule.log).not.toHaveBeenCalled()
      } else {
        fail('Unable to retrieve test file.')
      }

      done()
    })

    it('run fails and logs an error messages when build rules are not present.', async (done) => {
      const { rule } = await initialize()

      expect(await rule.run()).toBe(false)
      expect(rule.log).toHaveBeenCalledWith({
        severity: 'error',
        name: 'CheckForMissingBuildRule(build;finalize;;LaTeX_article.tex)',
        text: 'No applicable build rule was found for main source file `LaTeX_article.tex`.'
      })

      done()
    })

    it('run succeeds and does not any log error messages when targets are available when a jobname is set.', async (done) => {
      const { dicy, rule, options } = await initialize({
        options: { jobName: 'foo' }
      })
      const file = await dicy.getFile('LaTeX_article.tex')
      if (file) {
        const otherRule = new Rule(rule.state, 'build', 'execute', options, [file])

        dicy.addRule(otherRule)

        expect(await rule.run()).toBe(true)
        expect(rule.log).not.toHaveBeenCalled()
      } else {
        fail('Unable to retrieve test file.')
      }

      done()
    })

    it('run fails and logs an error messages when targets are not available when a jobname is set.', async (done) => {
      const { rule } = await initialize({
        options: { jobName: 'foo' }
      })

      expect(await rule.run()).toBe(false)
      expect(rule.log).toHaveBeenCalledWith({
        severity: 'error',
        name: 'CheckForMissingBuildRule(build;finalize;foo;LaTeX_article.tex)',
        text: 'No applicable build rule was found for main source file `LaTeX_article.tex` with job name of `foo`.'
      })

      done()
    })
  })
})
