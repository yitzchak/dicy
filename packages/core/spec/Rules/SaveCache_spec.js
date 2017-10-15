/* @flow */

import 'babel-polyfill'
import path from 'path'

import File from '../../src/File'
import Rule from '../../src/Rule'
import SaveCache from '../../src/Rules/SaveCache'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = SaveCache,
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, ...rest })
}

describe('SaveCache', () => {
  let loadRule: Rule
  let finalizeRule: Rule
  let otherRule: Rule
  let saveCache: SaveCache

  beforeEach(async (done) => {
    const { dicy, rule } = await initialize({
      options: { engine: 'foo' }
    })
    const options = rule.state.getJobOptions()

    loadRule = new Rule(rule.state, 'load', 'execute', options)
    dicy.addRule(loadRule)

    finalizeRule = new Rule(rule.state, 'load', 'finalize', options)
    dicy.addRule(finalizeRule)

    otherRule = new Rule(rule.state, 'build', 'execute', options)
    dicy.addRule(otherRule)

    spyOn(File, 'safeDump').and.callFake(() => Promise.resolve())

    saveCache = rule

    done()
  })

  describe('preEvaluate', () => {
    beforeEach(() => {
      saveCache.actions.set('run', new Set())
    })

    it('verifies that run action is removed if all outputs are virtual', async (done) => {
      await saveCache.preEvaluate()

      expect(saveCache.actions.has('run')).toBeFalsy()

      done()
    })

    it('verifies that run action is not removed if some outputs are not virtual', async (done) => {
      await otherRule.getOutput('PortableDocumentFormat.pdf')
      await saveCache.preEvaluate()

      expect(saveCache.actions.has('run')).toBeTruthy()

      done()
    })
  })

  describe('run', () => {
    it('verifies that cache is saved with correct values.', async (done) => {
      const cachePath = path.resolve(__dirname, '..', 'fixtures', 'file-types', 'LaTeX_article-cache.yaml')
      const expectedCache = jasmine.objectContaining({
        version: '0.10.0',
        filePath: 'LaTeX_article.tex',
        options: jasmine.objectContaining({ engine: 'foo' }),
        files: {
          'dicy-instance.yaml-ParsedYAML': jasmine.objectContaining({
            timeStamp: jasmine.anything(),
            value: { engine: 'foo', loadUserOptions: false },
            jobNames: [],
            type: 'ParsedYAML'
          }),
          'LaTeX_article.tex': jasmine.objectContaining({
            timeStamp: jasmine.anything(),
            hash: jasmine.anything(),
            jobNames: [],
            type: 'LaTeX',
            subType: 'article'
          })
        },
        rules: [{
          name: 'Rule',
          command: 'load',
          phase: 'execute',
          parameters: [],
          inputs: [],
          outputs: []
        }, {
          name: 'Rule',
          command: 'load',
          phase: 'finalize',
          parameters: [],
          inputs: [],
          outputs: []
        }, {
          name: 'Rule',
          command: 'build',
          phase: 'execute',
          parameters: [],
          inputs: ['LaTeX_article.tex'],
          outputs: []
        }]
      })

      await otherRule.getInput('LaTeX_article.tex')

      expect(await saveCache.run()).toBe(true)

      expect(File.safeDump).toHaveBeenCalledWith(cachePath, expectedCache)

      done()
    })
  })
})
