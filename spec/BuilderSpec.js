/* @flow */

import 'babel-polyfill'
import path from 'path'

import { Builder } from '../src/main'

describe('Builder', () => {
  let builder: Builder

  beforeEach(async (done) => {
    const options = { ignoreCache: true, engine: 'pdflatex' }
    builder = await Builder.create(path.resolve(__dirname, 'fixtures', 'foo.tex'), options, message => console.log(message.text))
    done()
  })

  it('verifies that Builder run returns expected true', async (done) => {
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, 10000)
})
