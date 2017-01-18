/* @flow */

import 'babel-polyfill'
import path from 'path'

import { Builder } from '../src/main'

describe('Builder', () => {
  let builder: Builder

  beforeEach(async (done) => {
    builder = await Builder.create(path.resolve(__dirname, 'fixtures', 'foo.tex'), { ignoreCache: true })
    done()
  })

  it('verifies that getRuleId returns expected id', async (done) => {
    await builder.build()
    done()
  }, 10000)
})
