/* @flow */

import 'babel-polyfill'
import path from 'path'
import fs from 'fs-promise'
import childProcess from 'mz/child_process'
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
        let expected = { types: [], events: [] }
        let events = []
        const filePath = path.resolve(fixturesPath, 'builder-tests', name)

        // Initialize the builder and listen for messages
        builder = await Builder.create(filePath)

        // Load the event archive
        const eventFilePath = builder.resolvePath('-events.yaml', {
          absolute: true,
          useJobName: false,
          useOutputDirectory: false
        })
        if (await fs.exists(eventFilePath)) {
          const contents = await fs.readFile(eventFilePath, { encoding: 'utf-8' })
          expected = yaml.safeLoad(contents)
          for (const type of expected.types) {
            builder.on(type, event => { events.push(event) })
          }
        }

        // Run the builder
        expect(await builder.run('load')).toBeTruthy()

        for (const command of builder.options.check || []) {
          try {
            await childProcess.exec(command)
          } catch (error) {
            done()
            // $FlowIgnore
            pending(`Skipping test of ${name} since \`${command}\` failed.`)
            return
          }
        }

        expect(await builder.run('build')).toBeTruthy()

        expect(await builder.run('save')).toBeTruthy()

        // $FlowIgnore
        if (expected.types.length !== 0) expect(events).toReceiveEvents(expected.events)

        done()
      }, ASYNC_TIMEOUT)
    }
  })
})
