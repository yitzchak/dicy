/* @flow */

import 'babel-polyfill'
import { BuildState } from '../src/main'

describe('BuildState', () => {
  let buildState: BuildState

  beforeEach(() => {
    buildState = new BuildState('foo.tex')
  })

  it('verifies that getRuleId returns expected id', () => {
    buildState.phase = 'execute'
    buildState.command = 'build'
    const result = buildState.getRuleId('quux', 'bar', 'foo.tex')
    const expectedResult = 'quux(build;execute;bar;foo.tex)'
    expect(result).toEqual(expectedResult)
  })
})
