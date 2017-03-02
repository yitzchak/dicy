/* @flow */

import 'babel-polyfill'
import path from 'path'
import readdir from 'readdir-enhanced'
import childProcess from 'mz/child_process'

import { Builder, File } from '../src/main'
import { cloneFixtures, customMatchers } from './helpers'

const ASYNC_TIMEOUT = 50000

describe('Builder', () => {
  let builder: Builder
  let fixturesPath: string
  const testPath: string = path.join(__dirname, 'fixtures', 'builder-tests')
  let tests: Array<string> = readdir.sync(testPath, { filter: /\.(lhs|tex|Rnw)$/i })

  beforeEach(async (done) => {
    fixturesPath = await cloneFixtures()
    // $FlowIgnore
    jasmine.addMatchers(customMatchers)
    done()
  })

  describe('can successfully build', () => {
    for (const name of tests) {
      const spec = it(name, async (done) => {
        let expected = { types: [], events: [] }
        let events = []
        const filePath = path.resolve(fixturesPath, 'builder-tests', name)

        // Initialize the builder and listen for messages
        builder = await Builder.create(filePath)

        // Load the event archive
        const eventFilePath = builder.resolvePath(':dir/:name-events.yaml')
        if (await File.canRead(eventFilePath)) {
          expected = await File.safeLoad(eventFilePath)
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
            // $FlowIgnore
            spec.pend(`Skipped test since required program is not available (\`${command}\` was not successful).`)
            done()
            return
          }
        }

        expect(await builder.run('build', 'log', 'save')).toBeTruthy()

        // $FlowIgnore
        if (expected.types.length !== 0) expect(events).toReceiveEvents(expected.events)

        done()
      }, ASYNC_TIMEOUT)
    }
  })
})
