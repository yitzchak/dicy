/* @flow */

import 'babel-polyfill'
import path from 'path'
import fs from 'fs-promise'
import yaml from 'js-yaml'

import { Builder } from '../src/main'
import { cloneFixtures, customMatchers } from './helpers'

const ASYNC_TIMEOUT = 40000

describe('Builder', () => {
  let builder: Builder
  let fixturesPath: string
  let tests: Array<string> = fs.readdirSync(path.join(__dirname, 'fixtures', 'builder-tests')).filter(name => /\.(tex|Rnw)$/i.test(name))

  beforeEach(async (done) => {
    fixturesPath = await cloneFixtures()
    // $FlowIgnore
    jasmine.addMatchers(customMatchers)
    done()
  })

  describe('proper behavior of build command', () => {
    for (const name of tests) {
      it(`verifies that ${name} support works`, async (done) => {
        const filePath = path.resolve(fixturesPath, 'builder-tests', name)
        builder = await Builder.create(filePath)
        const eventFilePath = builder.resolvePath('-events.yaml', {
          absolute: true,
          useJobName: false,
          useOutputDirectory: false
        })
        const messages = []
        let events = { messages: [] }
        if (await fs.exists(eventFilePath)) {
          const contents = await fs.readFile(eventFilePath, { encoding: 'utf-8' })
          events = yaml.safeLoad(contents)
        }
        builder.buildState.on('message', message => { messages.push(message) })
        expect(await builder.run('build')).toBeTruthy()
        // $FlowIgnore
        expect(messages).toEqualMessages(events.messages)
        done()
      }, ASYNC_TIMEOUT)
    }
  })
})
