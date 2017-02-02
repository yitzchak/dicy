/* @flow */

import 'babel-polyfill'
import path from 'path'
import fs from 'fs-promise'

import { Builder } from '../src/main'
import { cloneFixtures, customMatchers } from './helpers'

import type { Message } from '../src/types'

const ASYNC_TIMEOUT = 40000

describe('Builder', () => {
  let builder: Builder
  let messages: Array<Message>
  let fixturesPath: string
  let tests: Array<string> = fs.readdirSync(path.join(__dirname, 'fixtures', 'builder-tests')).filter(name => /\.(tex|Rnw)$/i.test(name))

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

  describe('proper behavior of build command', () => {
    for (const name of tests) {
      it(`verifies that ${name} support works`, async (done) => {
        await initializeBuilder(path.join('builder-tests', name))
        const meta = builder.buildState.options.meta || {}
        expect(await builder.run('build')).toBeTruthy()
        // $FlowIgnore
        expect(messages).toEqualMessages(meta.messages || [])
        if (meta.evaluations) {
          expect(builder.buildState.evaluations).toEqual(meta.evaluations)
        }
        done()
      }, ASYNC_TIMEOUT)
    }
  })
})
