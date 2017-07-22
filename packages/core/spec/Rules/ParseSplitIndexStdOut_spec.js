/* @flow */

import 'babel-polyfill'
import path from 'path'

import State from '../../src/State'
import File from '../../src/File'
import ParseSplitIndexStdOut from '../../src/Rules/ParseSplitIndexStdOut'

describe('ParseSplitIndexStdOut', () => {
  it('verifies that all error messages are successfully parsed.', async (done) => {
    const sourceName = 'error-warning.tex'
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
    const sourcePath = path.resolve(fixturesPath, sourceName)
    const outName = 'foo.log-SplitIndexStdOut'
    const parsedOutPath = 'foo.log-ParsedSplitIndexStdOut'
    const outputs = ['output/job-1-theories.idx', 'output/job-1-persons.idx']
    const state: State = await State.create(sourcePath)
    const outFile: ?File = await state.getFile(outName)

    expect(outFile).toBeDefined()
    if (!outFile) return

    outFile.value = `splitindex.pl 0.1
Copyright (c) 2002 Markus Kohm <kohm@gmx.de>
New index file output/job-1-theories.idx
New index file output/job-1-persons.idx
Close output/job-1-persons.idx
Close output/job-1-theories.idx

output/job-1-theories.idx with 1 lines
output/job-1-persons.idx with 1 lines`

    const parser: ParseSplitIndexStdOut = new ParseSplitIndexStdOut(state, 'build', 'execute', null, outFile)

    await parser.parse()

    const parsedLog: ?File = parser.outputs.get(parsedOutPath)

    expect(parsedLog).toBeDefined()
    if (!parsedLog) return

    expect(parsedLog.value).toBeDefined()
    if (!parsedLog.value) return

    expect(parsedLog.value.outputs).toEqual(outputs)

    done()
  })
})
