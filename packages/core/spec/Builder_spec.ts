/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../node_modules/@types/jasmine-expect/index.d.ts" />

import * as fs from 'fs-extra'
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

  beforeEach(async (done) => {
    fixturesPath = await cloneFixtures()
    jasmine.addMatchers(customMatchers)
    done()
  })

  describe('can successfully build', () => {
    const testPath: string = path.join(__dirname, 'fixtures', 'builder-tests')
    let tests: Array<string> = readdir.sync(testPath, { filter: /\.(lhs|tex|Rnw|lagda|Pnw)$/i })

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
        expect(await dicy.run(['load'])).toBeTrue()

        if (!await dicy.run(['test'])) {
          const errorMessages: string = messages.filter(message => message.severity === 'error').map(formatMessage).join('\n')
          spec.pend(`Skipped spec since test command failed.\n${errorMessages}`.trim())
          done()
          return
        }

        expect(await dicy.run(['build', 'log', 'save'])).toBeTrue()

        expect(messages).toReceiveMessages(expected)

        done()
      }, ASYNC_TIMEOUT)
    }
  })

  describe('Caching functionality', () => {
    it('Correctly loads and validates cache if outputs have been removed with copy targets enabled.', async (done) => {
      const filePath: string = path.join(fixturesPath, 'cache-tests', 'copy-targets.tex')
      const outputPath: string = path.join(fixturesPath, 'cache-tests', 'copy-targets.pdf')
      let messages: Message[] = []
      dicy = await Builder.create(filePath)
      dicy.on('log', (newMessages: Message[]) => { messages = messages.concat(newMessages) })

      expect(await dicy.run(['load', 'build'])).toBeTrue()
      expect(messages).toReceiveMessages([])
      expect(await fs.pathExists(outputPath)).toBeTrue()

      done()
    })
  })
})
