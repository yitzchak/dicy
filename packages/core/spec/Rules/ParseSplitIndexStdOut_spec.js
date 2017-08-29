/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseSplitIndexStdOut from '../../src/Rules/ParseSplitIndexStdOut'
import { initializeRule } from '../helpers'

describe('ParseSplitIndexStdOut', () => {
  it('verifies that all error messages are successfully parsed.', async (done) => {
    const parsedOutPath = 'foo.log-ParsedSplitIndexStdOut'
    const { rule } = await initializeRule({
      RuleClass: ParseSplitIndexStdOut,
      filePath: 'error-warning.tex',
      parameters: [{
        filePath: 'foo.log-SplitIndexStdOut',
        value: `splitindex.pl 0.1
Copyright (c) 2002 Markus Kohm <kohm@gmx.de>
New index file job-1-theories.idx
New index file job-1-persons.idx
Close job-1-persons.idx
Close job-1-theories.idx

job-1-theories.idx with 1 lines
job-1-persons.idx with 1 lines`
      }]
    })
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
