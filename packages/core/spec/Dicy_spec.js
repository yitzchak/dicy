/* @flow */

import 'babel-polyfill'
import path from 'path'
import readdir from 'readdir-enhanced'
import childProcess from 'child_process'

import { DiCy, File } from '../src/main'
import { cloneFixtures, customMatchers } from './helpers'

const ASYNC_TIMEOUT = 50000

function doCheck (command: string): Promise<boolean> {
  return new Promise(resolve => {
    childProcess.exec(command, error => resolve(!error))
  })
}

describe('DiCy', () => {
  let dicy: DiCy
  let fixturesPath: string
  const testPath: string = path.join(__dirname, 'fixtures', 'builder-tests')
  let tests: Array<string> = readdir.sync(testPath, { filter: /\.(lhs|tex|Rnw|lagda|Pnw)$/i })

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

        // Initialize dicy and listen for messages
        dicy = await DiCy.create(filePath)

        // Load the event archive
        const eventFilePath = dicy.resolvePath('$ROOTDIR/$NAME-events.yaml')
        if (await File.canRead(eventFilePath)) {
          expected = await File.safeLoad(eventFilePath)
          for (const type of expected.types) {
            dicy.on(type, event => { events.push(event) })
          }
        }

        // Run the builder
        expect(await dicy.run('load')).toBeTruthy()

        for (const command of dicy.options.check || []) {
          if (!await doCheck(command)) {
            // $FlowIgnore
            spec.pend(`Skipped test since required program is not available (\`${command}\` was not successful).`)
            done()
            return
          }
        }

        expect(await dicy.run('build', 'log', 'save')).toBeTruthy()

        // $FlowIgnore
        if (expected.types.length !== 0) expect(events).toReceiveEvents(expected.events)

        done()
      // $FlowIgnore
      }, ASYNC_TIMEOUT)
    }
  })
})
