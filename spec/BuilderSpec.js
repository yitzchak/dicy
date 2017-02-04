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
        let events = { }
        const log = []
        const command = []
        const action = []
        const filePath = path.resolve(fixturesPath, 'builder-tests', name)

        // Initialize the builder and listen for messages
        builder = await Builder.create(filePath)
        builder
          .on('log', message => { log.push(message) })
          .on('action', event => { action.push(event) })
          .on('command', event => { command.push(event) })

        // Load the event archive
        const eventFilePath = builder.resolvePath('-events.yaml', {
          absolute: true,
          useJobName: false,
          useOutputDirectory: false
        })
        if (await fs.exists(eventFilePath)) {
          const contents = await fs.readFile(eventFilePath, { encoding: 'utf-8' })
          events = yaml.safeLoad(contents)
        }

        // Run the builder
        expect(await builder.run('build')).toBeTruthy()

        // Check the received messages
        if ('action' in events) expect(action).toEqual(events.action)
        if ('command' in events) expect(command).toEqual(events.command)
        // $FlowIgnore
        if ('log' in events) expect(log).toEqualMessages(events.log)

        done()
      }, ASYNC_TIMEOUT)
    }
  })
})
