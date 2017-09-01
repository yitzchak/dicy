/* @flow */

import 'babel-polyfill'

import SplitIndex from '../../src/Rules/SplitIndex'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = SplitIndex,
  parameters = [{
    filePath: 'IndexControlFile.idx'
  }, {
    filePath: 'LaTeX.log-ParsedLaTeXLog'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('SplitIndex', () => {
  describe('appliesToParameters', () => {
    it('returns false if there are no splitindex notices in the log.', async (done) => {
      const { rule, options } = await initialize()

      expect(await SplitIndex.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns true if there are splitindex notices in the log.', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'IndexControlFile.idx'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [{
              severity: 'info',
              text: 'Using splitted index at IndexControlFile.idx'
            }],
            calls: []
          }
        }]
      })

      expect(await SplitIndex.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns true if there are splitindex calls in the log.', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'IndexControlFile.idx'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['splitindex', 'IndexControlFile.idx'],
              options: { makeindex: '' },
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      expect(await SplitIndex.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })
  })

  describe('getFileActions', () => {
    it('returns a run action for a index control file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('IndexControlFile.idx')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a updateDependencies action for a splitindex log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('IndexControlFile.ilg-ParsedSplitIndexLog')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a no actions for a latex log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual([])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for index file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['splitindex', '-v', '-v', '-m', '', '{{$FILEPATH_0}}'],
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
