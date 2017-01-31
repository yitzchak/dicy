/* @flow */

import 'babel-polyfill'
import path from 'path'

import { Builder } from '../src/main'
import { cloneFixtures, customMatchers } from './helpers'

import type { Message } from '../src/types'

const ASYNC_TIMEOUT = 40000

describe('Builder', () => {
  let builder: Builder
  let messages: Array<Message>
  let fixturesPath: string

  async function initializeBuilder (filePath: string) {
    const options = {
      ignoreCache: true,
      severity: 'error',
      reportLogMessages: true
    }
    messages = []
    builder = await Builder.create(path.resolve(fixturesPath, filePath), options, message => { messages.push(message) })
  }

  beforeEach(async (done) => {
    fixturesPath = await cloneFixtures()
    // $FlowIgnore
    jasmine.addMatchers(customMatchers)
    done()
  })

  it('verifies that biblatex support works', async (done) => {
    await initializeBuilder('pkg-biblatex.tex')
    expect(await builder.run('build')).toBeTruthy()
    // $FlowIgnore
    expect(messages).toEqualMessages([])
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that natbib support works', async (done) => {
    await initializeBuilder('pkg-natbib.tex')
    expect(await builder.run('build')).toBeTruthy()
    // $FlowIgnore
    expect(messages).toEqualMessages([])
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that nomencl support works', async (done) => {
    await initializeBuilder('pkg-nomencl.tex')
    expect(await builder.run('build')).toBeTruthy()
    // $FlowIgnore
    expect(messages).toEqualMessages([{
      name: 'makeindex',
      type: 'Input style',
      text: 'Unknown specifier lethead_suffix.'
    }, {
      name: 'makeindex',
      type: 'Input style',
      text: 'Unknown specifier lethead_prefix.'
    }, {
      name: 'makeindex',
      type: 'Input style',
      text: 'Unknown specifier lethead_flag.'
    }])
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that bibref support works', async (done) => {
    await initializeBuilder('pkg-autind-bibref.tex')
    expect(await builder.run('build')).toBeTruthy()
    // $FlowIgnore
    expect(messages).toEqualMessages([])
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that glossary support works', async (done) => {
    await initializeBuilder('pkg-glossaries.tex')
    // $FlowIgnore
    expect(messages).toEqualMessages([])
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, ASYNC_TIMEOUT)

  it('verifies that MetaPost support works', async (done) => {
    await initializeBuilder('pkg-feynmp.tex')
    // $FlowIgnore
    expect(messages).toEqualMessages([])
    expect(await builder.run('build')).toBeTruthy()
    done()
  }, ASYNC_TIMEOUT)
})
