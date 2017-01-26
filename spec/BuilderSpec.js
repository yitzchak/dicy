/* @flow */

import 'babel-polyfill'
import path from 'path'

import { Builder } from '../src/main'
import type { Message } from '../src/types'

const ASYNC_TIMEOUT = 20000

describe('Builder', () => {
  let builder: Builder
  let messages: Array<Message>

  async function initializeBuilder (filePath: string) {
    const options = {
      ignoreCache: true,
      severity: 'warning',
      reportLogMessages: true
    }
    messages = []
    builder = await Builder.create(path.resolve(__dirname, 'fixtures', filePath), options, message => { messages.push(message) })
  }

  it('verifies that Builder run returns expected true', async (done) => {
    await initializeBuilder('foo.tex')
    expect(messages).toEqual([])
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that nomencl support works', async (done) => {
    await initializeBuilder('pkg-nomencl.tex')
    expect(messages).toEqual([])
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that bibref support works', async (done) => {
    await initializeBuilder('pkg-autind-bibref.tex')
    expect(messages).toEqual([])
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that glossary support works', async (done) => {
    await initializeBuilder('pkg-glossaries.tex')
    expect(messages).toEqual([])
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that MetaPost support works', async (done) => {
    await initializeBuilder('pkg-feynmp.tex')
    expect(messages).toEqual([])
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, ASYNC_TIMEOUT)
})
