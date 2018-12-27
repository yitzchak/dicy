/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import * as path from 'path'

import FindLogFiles from '../../src/Rules/FindLogFiles'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = FindLogFiles,
  filePath = 'error-warning.tex',
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, filePath, ...rest })
}

describe('FindLogFiles', () => {
  describe('run', () => {
    it('finds all log files when output directory is not set.', async (done) => {
      const { rule } = await initialize()

      expect(await rule.run()).toBeTrue()

      const filePaths = Array.from(rule.files).map(file => file.filePath)

      expect(filePaths).toContain('error-warning.log')

      done()
    })

    it('finds all log files when output directory is set.', async (done) => {
      const logPath = path.join('file-types', 'BiberLog.blg')
      const { rule } = await initialize({
        options: {
          jobName: 'BiberLog',
          outputDirectory: 'file-types'
        }
      })

      expect(await rule.run()).toBeTrue()

      const filePaths = Array.from(rule.files).map(file => file.filePath)

      expect(filePaths).toContain(logPath)

      done()
    })
  })
})
