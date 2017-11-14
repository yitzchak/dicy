/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import * as path from 'path'
import * as readdir from 'readdir-enhanced'
import * as childProcess from 'child_process'

import DiCy from '../src/DiCy'
import File from '../src/File'
import { LogEvent, Message } from '@dicy/types'
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
    jasmine.addMatchers(customMatchers)
    done()
  })

  describe('can successfully build', () => {
    for (const name of tests) {
      const spec: any = it(name, async (done) => {
        let expected: Message[] = []
        let messages: Message[] = []
        const filePath = path.resolve(fixturesPath, 'builder-tests', name)

        // Initialize dicy and listen for messages
        dicy = await DiCy.create(filePath)

        // Load the log archive
        const logFilePath = dicy.resolvePath('$ROOTDIR/$NAME-log.yaml')
        if (await File.canRead(logFilePath)) {
          expected = await File.readYaml(logFilePath)
          dicy.on('log', (event: LogEvent) => { messages = messages.concat(event.messages) })
        }

        // Run the builder
        expect(await dicy.run('load')).toBeTruthy()

        for (const command of dicy.options.check || []) {
          if (!await doCheck(command)) {
            spec.pend(`Skipped test since required program is not available (\`${command}\` was not successful).`)
            done()
            return
          }
        }

        expect(await dicy.run('build', 'log', 'save')).toBeTruthy()

        expect(messages).toReceiveMessages(expected)

        done()
      }, ASYNC_TIMEOUT)
    }
  })
})
