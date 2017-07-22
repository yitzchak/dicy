/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import SplitIndex from '../../src/Rules/SplitIndex'

describe('SplitIndex', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: SplitIndex

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreHomeOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new SplitIndex(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToParameters', () => {
    beforeEach(async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'])
      done()
    })

    it('returns false if there are no splitindex notices in the log.', async (done) => {
      rule.secondParameter.value = {
        inputs: [],
        outputs: [],
        messages: [],
        calls: []
      }

      expect(await SplitIndex.appliesToParameters(builder.state, 'build', 'execute', null, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns true if there are splitindex notices in the log.', async (done) => {
      rule.secondParameter.value = {
        inputs: [],
        outputs: [],
        messages: [{
          severity: 'info',
          text: 'Using splitted index at IndexControlFile.idx'
        }],
        calls: []
      }

      expect(await SplitIndex.appliesToParameters(builder.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns true if there are splitindex calls in the log.', async (done) => {
      rule.secondParameter.value = {
        inputs: [],
        outputs: [],
        messages: [],
        calls: [{
          command: 'splitindex -m \'\' IndexControlFile.idx',
          status: 'executed (allowed)'
        }]
      }

      expect(await SplitIndex.appliesToParameters(builder.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })
  })

  describe('getFileActions', () => {
    beforeEach(async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'])
      done()
    })

    it('returns a run action for a index control file.', async (done) => {
      const file = await builder.getFile('IndexControlFile.idx')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a updateDependencies action for a splitindex log file.', async (done) => {
      const file = await builder.getFile('IndexControlFile.ilg-ParsedSplitIndexLog')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a no actions for a latex log file.', async (done) => {
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual([])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for index file.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'])

      expect(rule.constructCommand()).toEqual({
        args: ['splitindex', '-v', '-v', '-m', '', '$DIR_0/$BASE_0'],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: ['$DIR_0/$NAME_0.log-ParsedSplitIndexStdOut'],
        stdout: '$DIR_0/$NAME_0.log-SplitIndexStdOut',
        stderr: '$DIR_0/$NAME_0.log-SplitIndexStdErr'
      })

      done()
    })
  })
})
