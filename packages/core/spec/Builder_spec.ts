/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import * as path from 'path'
import * as readdir from 'readdir-enhanced'

import Builder from '../src/Builder'
import File from '../src/File'
import { Message } from '@dicy/types'
import { cloneFixtures, customMatchers, formatMessage } from './helpers'

const ASYNC_TIMEOUT = 50000

describe('Builder', () => {
  let dicy: Builder
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
        dicy = await Builder.create(filePath)

        // Load the log archive
        const logFilePath = dicy.resolvePath('$ROOTDIR/$NAME-log.yaml')
        if (await File.canRead(logFilePath)) {
          expected = await File.readYaml(logFilePath)
          dicy.on('log', (newMessages: Message[]) => { messages = messages.concat(newMessages) })
        }

        // Run the builder
        expect(await dicy.run(['load'])).toBeTruthy()

        if (!await dicy.run(['test'])) {
          const errorMessages: string = messages.filter(message => message.severity === 'error').map(formatMessage).join('\n')
          spec.pend(`Skipped spec since test command failed.\n${errorMessages}`.trim())
          done()
          return
        }

        expect(await dicy.run(['build', 'log', 'save'])).toBeTruthy()

        expect(messages).toReceiveMessages(expected)

        done()
      }, ASYNC_TIMEOUT)
    }
  })
})
