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
    state = await State.create(path.resolve(fixturesPath, 'file.tex'))
    state.env.HOME = fixturesPath
    applyOptions = new ApplyOptions(state, 'load', 'execute')
    done()
  })

  it('', async (done) => {
    const f: File = await applyOptions.getResolvedFile('$NAME.yaml-ParsedYAML')
    const g: File = await applyOptions.getResolvedFile('$BASE-ParsedLaTeXMagic')

    done()
  })
})
