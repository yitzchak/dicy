/* @flow */

import 'babel-polyfill'
import path from 'path'

import { Builder } from '../src/main'
import type { Message } from '../src/types'

describe('Builder', () => {
  let builder: Builder
  let messages: Array<Message>

  beforeEach(async (done) => {
    const options = { ignoreCache: true, severity: 'error' }
    messages = []
    builder = await Builder.create(path.resolve(__dirname, 'fixtures', 'foo.tex'), options, message => { messages.push(message) })
    done()
  })

  it('verifies that Builder run returns expected true', async (done) => {
    expect(await builder.run('build')).toBeTruthy()
    expect(messages).toEqual([])
    done()
  }, 10000)
})
