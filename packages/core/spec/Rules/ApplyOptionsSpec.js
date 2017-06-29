/* @flow */

import 'babel-polyfill'
import path from 'path'

import State from '../../src/State'
import File from '../../src/File'
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
      commands: []
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
    applyOptions = new ApplyOptions(state, 'load', 'execute')
    done()
  })

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
