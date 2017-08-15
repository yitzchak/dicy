/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseSplitIndexStdOut from '../../src/Rules/ParseSplitIndexStdOut'
import { initializeRule } from '../helpers'

async function initialize (filePath: string, logPath: string, logValue: any, options: Object = {}) {
  return initializeRule({
    RuleClass: ParseSplitIndexStdOut,
    filePath,
    parameters: [{
      filePath: logPath,
      value: logValue
    }],
    options
  })
}

describe('ParseSplitIndexStdOut', () => {
  it('verifies that all error messages are successfully parsed.', async (done) => {
    const sourceName = 'error-warning.tex'
    const outName = 'foo.log-SplitIndexStdOut'
    const parsedOutPath = 'foo.log-ParsedSplitIndexStdOut'
    const outValue = `splitindex.pl 0.1
Copyright (c) 2002 Markus Kohm <kohm@gmx.de>
New index file job-1-theories.idx
New index file job-1-persons.idx
Close job-1-persons.idx
Close job-1-theories.idx

job-1-theories.idx with 1 lines
job-1-persons.idx with 1 lines`
    const { rule } = await initialize(sourceName, outName, outValue)
    const expectedParsedLog = {
      inputs: [],
      outputs: ['job-1-theories.idx', 'job-1-persons.idx'],
      messages: [{
        severity: 'info',
        name: 'splitindex',
        text: 'New index file job-1-theories.idx'
      }, {
        severity: 'info',
        name: 'splitindex',
        text: 'New index file job-1-persons.idx'
      }, {
        severity: 'info',
        name: 'splitindex',
        text: 'Close job-1-persons.idx'
      }, {
        severity: 'info',
        name: 'splitindex',
        text: 'Close job-1-theories.idx'
      }, {
        severity: 'info',
        name: 'splitindex',
        text: 'job-1-theories.idx with 1 lines'
      }, {
        severity: 'info',
        name: 'splitindex',
        text: 'job-1-persons.idx with 1 lines'
      }],
      calls: []
    }

    await rule.parse()

    const parsedLog: ?File = await rule.getFile(parsedOutPath)

    expect(parsedLog).toBeDefined()
    if (!parsedLog) return

    expect(parsedLog.value).toBeDefined()
    if (!parsedLog.value) return

    expect(parsedLog.value).toEqual(expectedParsedLog)

    done()
  })
})
