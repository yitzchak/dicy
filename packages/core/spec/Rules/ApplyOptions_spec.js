/* @flow */

import 'babel-polyfill'
import path from 'path'

import State from '../../src/State'
import File from '../../src/File'
import Rule from '../../src/Rule'
import ApplyOptions from '../../src/Rules/ApplyOptions'

describe('ApplyOptions', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let state: State
  let applyOptions: ApplyOptions

  beforeEach(async (done) => {
    state = await State.create(path.resolve(fixturesPath, 'file.tex'), [{
      name: 'a',
      type: 'boolean',
      description: 'A',
      commands: [],
      noInvalidate: true
    }, {
      name: 'b',
      type: 'string',
      description: 'B',
      commands: []
    }, {
      name: 'c',
      type: 'number',
      description: 'C',
      commands: []
    }])
    state.env.HOME = fixturesPath
    applyOptions = new ApplyOptions(state, 'load', 'execute', state.getJobOptions())
    done()
  })

  describe('assignOptions', () => {
    it('verifies that high priority configuration overrides low priority configuration.', async (done) => {
      const yaml: ?File = await applyOptions.getResolvedFile('$NAME.yaml-ParsedYAML')
      const magic: ?File = await applyOptions.getResolvedFile('$BASE-ParsedLaTeXMagic')

      expect(yaml).toBeDefined()
      expect(magic).toBeDefined()

      if (yaml && magic) {
        yaml.value = {
          a: true,
          b: 'foo'
        }
        magic.value = {
          a: false,
          c: 743
        }

        await applyOptions.assignOptions()

        expect(state.options.a).toBe(false)
        expect(state.options.b).toBe('foo')
        expect(state.options.c).toBe(743)
      }

      done()
    })
  })

  describe('checkForConfigurationChange', () => {
    let loadRule: Rule
    let finalizeRule: Rule
    let otherRule: Rule

    beforeEach(() => {
      state.options = {
        a: true,
        b: 'foo'
      }

      loadRule = new Rule(state, 'load', 'execute', state.getJobOptions())
      state.addRule(loadRule)

      finalizeRule = new Rule(state, 'load', 'finalize', state.getJobOptions())
      state.addRule(finalizeRule)

      otherRule = new Rule(state, 'build', 'execute', state.getJobOptions())
      state.addRule(otherRule)
    })

    it('verifies that not changing options does not remove any rules.', () => {
      applyOptions.checkForConfigurationChange(state.options)

      expect(Array.from(state.rules.keys())).toEqual([
        loadRule.id,
        finalizeRule.id,
        otherRule.id
      ])
    })

    it('verifies that setting an option with `noInvalidate` does not remove any rules.', () => {
      applyOptions.checkForConfigurationChange({ a: false, b: 'foo' })

      expect(Array.from(state.rules.keys())).toEqual([
        loadRule.id,
        finalizeRule.id,
        otherRule.id
      ])
    })

    it('verifies that setting an option without `noInvalidate` removes appropriate rules.', () => {
      applyOptions.checkForConfigurationChange({ a: true, b: 'bar' })

      expect(Array.from(state.rules.keys())).toEqual([
        loadRule.id
      ])
    })
  })
})
