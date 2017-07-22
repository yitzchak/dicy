/* @flow */

import 'babel-polyfill'
import path from 'path'

import State from '../../src/State'
import File from '../../src/File'
import ParseSplitIndexStdErr from '../../src/Rules/ParseSplitIndexStdErr'

describe('ParseSplitIndexStdErr', () => {
  it('verifies that all error messages are successfully parsed.', async (done) => {
    const sourceName = 'error-warning.tex'
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
    const sourcePath = path.resolve(fixturesPath, sourceName)
    const outName = 'foo.log-SplitIndexStdErr'
    const parsedOutPath = 'foo.log-ParsedSplitIndexStdErr'
    const messages = [{
      severity: 'error',
      name: 'splitindex',
      text: 'Cannot read raw index file foo.idx',
      log: {
        file: 'foo.log-SplitIndexStdErr',
        range: { start: 1, end: 1 }
      },
      source: {
        file: '/usr/local/bin/splitindex',
        range: { start: 86, end: 86 }
      }
    }]
    const state: State = await State.create(sourcePath)
    const outFile: ?File = await state.getFile(outName)

    expect(outFile).toBeDefined()
    if (!outFile) return

    outFile.value = 'Cannot read raw index file foo.idx at /usr/local/bin/splitindex line 86.'

    const parser: ParseSplitIndexStdErr = new ParseSplitIndexStdErr(state, 'build', 'execute', null, outFile)

    await parser.parse()

    const parsedLog: ?File = parser.outputs.get(parsedOutPath)

    expect(parsedLog).toBeDefined()
    if (!parsedLog) return

    expect(parsedLog.value).toBeDefined()
    if (!parsedLog.value) return

    expect(parsedLog.value.messages).toEqual(messages)

    done()
  })
})
