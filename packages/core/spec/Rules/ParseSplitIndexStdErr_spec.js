/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseSplitIndexStdErr from '../../src/Rules/ParseSplitIndexStdErr'
import { initializeRule } from '../helpers'

async function initialize (filePath: string, logPath: string, logValue: any, options: Object = {}) {
  return initializeRule({
    RuleClass: ParseSplitIndexStdErr,
    filePath,
    parameters: [{
      filePath: logPath,
      value: logValue
    }],
    options
  })
}

describe('ParseSplitIndexStdErr', () => {
  it('verifies that all error messages are successfully parsed.', async (done) => {
    const sourceName = 'error-warning.tex'
    const outName = 'foo.log-SplitIndexStdErr'
    const parsedOutPath = 'foo.log-ParsedSplitIndexStdErr'
    const { rule } = await initialize(sourceName,
      outName,
      'Cannot read raw index file foo.idx at /usr/local/bin/splitindex line 86.')
    const messages = [{
      severity: 'error',
      name: 'splitindex',
      text: 'Cannot read raw index file foo.idx',
      source: {
        file: '/usr/local/bin/splitindex',
        range: { start: 86, end: 86 }
      }
    }]

    await rule.parse()

    const parsedLog: ?File = await rule.getFile(parsedOutPath)

    expect(parsedLog).toBeDefined()
    if (!parsedLog) return

    expect(parsedLog.value).toBeDefined()
    if (!parsedLog.value) return

    expect(parsedLog.value.messages).toEqual(messages)

    done()
  })
})
