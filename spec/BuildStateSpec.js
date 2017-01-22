/* @flow */

import 'babel-polyfill'
import { BuildState } from '../src/main'

describe('BuildState', () => {
  let buildState: BuildState

  beforeEach(() => {
    buildState = new BuildState('foo.tex')
  })

  it('verifies that getRuleId returns expected id', () => {
    buildState.phase = 'initialize'
    expect(buildState.getRuleId('quux', 'bar', 'foo.tex')).toBe('quux(initialize;bar;foo.tex)')
  })
})
