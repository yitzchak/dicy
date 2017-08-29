/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseSplitIndexStdErr from '../../src/Rules/ParseSplitIndexStdErr'
import { initializeRule } from '../helpers'

describe('ParseSplitIndexStdErr', () => {
  it('verifies that all error messages are successfully parsed.', async (done) => {
    const parsedOutPath = 'foo.log-ParsedSplitIndexStdErr'
    const { rule } = await initializeRule({
      RuleClass: ParseSplitIndexStdErr,
      filePath: 'error-warning.tex',
      parameters: [{
        filePath: 'foo.log-SplitIndexStdErr',
        value: 'Cannot read raw index file foo.idx at /usr/local/bin/splitindex line 86.'
      }]
    })

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
