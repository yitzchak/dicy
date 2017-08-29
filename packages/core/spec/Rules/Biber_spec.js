/* @flow */

import 'babel-polyfill'

import Biber from '../../src/Rules/Biber'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Biber,
  parameters = [{
    filePath: 'BiberControlFile.bcf'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('Biber', () => {
  describe('getFileActions', () => {
    it('returns a run action for a control file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('BiberControlFile.bcf')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a updateDependencies action for a biber log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('BiberControlFile.blg-ParsedBiberLog')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a run action for a latex log file if a rerun biber instruction is found.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run Biber on the file: BiberControlFile and rerun LaTeX afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a no actions for a latex log file if no rerun biber instruction is found.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run Biber on the file: foo and rerun LaTeX afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual([])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for control file file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['biber', '{{$FILEPATH_0}}'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
      })

      done()
    })
  })
})
