/* @flow */

import 'babel-polyfill'
import { State } from '../src/main'

describe('State', () => {
  let state: State

  beforeEach(() => {
    state = new State('foo.tex')
  })

  it('verifies that getRuleId returns expected id', () => {
    const result = state.getRuleId('quux', 'build', 'execute', 'bar', 'foo.tex')
    const expectedResult = 'quux(build;execute;bar;foo.tex)'
    expect(result).toEqual(expectedResult)
  })
})
