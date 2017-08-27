/* @flow */

import 'babel-polyfill'

import CheckForMissingTargets from '../../src/Rules/CheckForMissingTargets'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}, targets = []) {
  return initializeRule({
    RuleClass: CheckForMissingTargets,
    options,
    targets
  })
}

describe('CheckForMissingTargets', () => {
  describe('run', () => {
    it('run succeeds and does not log any error messages when targets are available.', async (done) => {
      const { rule } = await initialize({}, ['PortableDocumentFormat.pdf'])

      expect(await rule.run()).toBe(true)
      expect(rule.log).not.toHaveBeenCalled()

      done()
    })

    it('run fails and logs an error messages when targets are not available.', async (done) => {
      const { rule } = await initialize()

      expect(await rule.run()).toBe(false)
      expect(rule.log).toHaveBeenCalledWith({
        severity: 'error',
        name: 'DiCy',
        text: 'No rule produced or was capable of producing a target for main source file `LaTeX_article.tex`.'
      })

      done()
    })

    it('run succeeds and does not any log error messages when targets are available when a jobname is set.', async (done) => {
      const { rule } = await initialize({ jobName: 'foo' }, ['PortableDocumentFormat.pdf'])

      const file = await rule.getFile('PortableDocumentFormat.pdf')
      file.jobNames.add('foo')

      expect(await rule.run()).toBe(true)
      expect(rule.log).not.toHaveBeenCalled()

      done()
    })

    it('run fails and logs an error messages when targets are not available when a jobname is set.', async (done) => {
      const { rule } = await initialize({ jobName: 'foo' }, ['PortableDocumentFormat.pdf'])

      expect(await rule.run()).toBe(false)
      expect(rule.log).toHaveBeenCalledWith({
        severity: 'error',
        name: 'DiCy',
        text: 'No rule produced or was capable of producing a target for main source file `LaTeX_article.tex` with job name of `foo`.'
      })

      done()
    })
  })
})
