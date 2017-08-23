/* @flow */

import 'babel-polyfill'
import path from 'path'

import FindLogFiles from '../../src/Rules/FindLogFiles'
import { initializeRule } from '../helpers'

async function initialize (options = {}) {
  return initializeRule({
    RuleClass: FindLogFiles,
    filePath: 'error-warning.tex',
    options
  })
}

describe('FindLogFiles', () => {
  describe('run', () => {
    it('finds all log files when output directory is not set.', async (done) => {
      const { rule } = await initialize()

      expect(await rule.run()).toBe(true)

      const filePaths = Array.from(rule.files).map(file => file.filePath)

      expect(filePaths).toContain('error-warning.log')

      done()
    })

    it('finds all log files when output directory is set.', async (done) => {
      const logPath = path.join('file-types', 'BiberLog.blg')
      const { rule } = await initialize({
        jobName: 'BiberLog',
        outputDirectory: 'file-types'
      })

      expect(await rule.run()).toBe(true)

      const filePaths = Array.from(rule.files).map(file => file.filePath)

      expect(filePaths).toContain(logPath)

      done()
    })
  })
})
