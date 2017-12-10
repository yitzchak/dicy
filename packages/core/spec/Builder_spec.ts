/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../node_modules/@types/jasmine-expect/index.d.ts" />

const fileUrl = require('file-url')
import * as fs from 'fs-extra'
import * as path from 'path'
import * as readdir from 'readdir-enhanced'

import Builder from '../src/Builder'
import File from '../src/File'
import { Message } from '@dicy/types'
import { cloneFixtures, customMatchers, formatMessage } from './helpers'

const ASYNC_TIMEOUT = 50000

describe('Builder', () => {
  let fixturesPath: string

  beforeEach(async (done) => {
    fixturesPath = await cloneFixtures()
    jasmine.addMatchers(customMatchers)
    done()
  })

  describe('can successfully build', () => {
    let dicy: Builder
    const testPath: string = path.join(__dirname, 'fixtures', 'builder-tests')
    let tests: Array<string> = readdir.sync(testPath, { filter: /\.(lhs|tex|Rnw|lagda|Pnw)$/i })

    for (const name of tests) {
      const spec: any = it(name, async (done) => {
        try {
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
            return
          }

          expect(await dicy.run(['build', 'log', 'save'])).toBeTrue()

          expect(messages).toReceiveMessages(expected)
        } catch (err) {
          fail(err)
        } finally {
          done()
        }
      }, ASYNC_TIMEOUT)
    }
  })

  describe('caching facility', () => {
    let filePath: string
    let intermediateOutputPath: string
    let outputDirectory: string
    let outputPath: string
    let outputUrl: string
    let primaryMessages: Message[]
    let primaryBuilder: Builder
    let secondaryMessages: Message[]
    let secondaryBuilder: Builder

    beforeEach(async (done) => {
      filePath = path.join(fixturesPath, 'cache-tests', 'copy-targets.tex')
      intermediateOutputPath = path.join(fixturesPath, 'cache-tests', 'output', 'copy-targets.pdf')
      outputDirectory = path.join(fixturesPath, 'cache-tests', 'output')
      outputPath = path.join(fixturesPath, 'cache-tests', 'copy-targets.pdf')
      outputUrl = fileUrl(outputPath)

      primaryMessages = []
      primaryBuilder = await Builder.create(filePath)
      primaryBuilder.on('log', (newMessages: Message[]) => { primaryMessages = primaryMessages.concat(newMessages) })

      secondaryMessages = []
      secondaryBuilder = await Builder.create(filePath)
      secondaryBuilder.on('log', (newMessages: Message[]) => { secondaryMessages = secondaryMessages.concat(newMessages) })

      done()
    })

    it('loads and validates cache if outputs have been removed with copy targets enabled.', async (done) => {
      expect(await primaryBuilder.run(['load', 'build'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      done()
    })

    it('rebuilds if all outputs have been removed with copy targets enabled.', async (done) => {
      expect(await primaryBuilder.run(['load', 'build', 'save'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      primaryMessages = []
      await fs.remove(outputPath)
      await fs.remove(outputDirectory)

      expect(await primaryBuilder.run(['load', 'build'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      done()
    })

    it('rebuilds if target has been removed with copy targets enabled.', async (done) => {
      expect(await primaryBuilder.run(['load', 'build', 'save'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      primaryMessages = []
      await fs.remove(outputPath)

      expect(await primaryBuilder.run(['load', 'build'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      done()
    })

    it('rebuilds if output directory has been removed with copy targets enabled.', async (done) => {
      expect(await primaryBuilder.run(['load', 'build', 'save'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      primaryMessages = []
      await fs.remove(outputDirectory)

      expect(await primaryBuilder.run(['load', 'build'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      done()
    })

    it('produces targets if a new builder is created.', async (done) => {
      expect(await primaryBuilder.run(['load', 'build', 'save'])).toBeTrue()
      expect(primaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await primaryBuilder.getTargets()).toEqual([outputUrl])

      expect(await secondaryBuilder.run(['load'])).toBeTrue()
      expect(secondaryMessages).toReceiveMessages([])
      expect(await fs.pathExists(intermediateOutputPath)).toBeTrue()
      expect(await fs.pathExists(outputPath)).toBeTrue()
      expect(await secondaryBuilder.getTargets()).toEqual([outputUrl])

      done()
    })
  })
})
