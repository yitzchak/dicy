/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import Biber from '../../src/Rules/Biber'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Biber,
  parameters = [{
    filePath: 'BiberControlFile.bcf'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('Biber', () => {
  describe('getActions', () => {
    it('returns a run action for a control file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('BiberControlFile.bcf')

      if (file) {
        const actions = rule.getActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a update action for a biber log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('BiberControlFile.blg-ParsedBiberLog')

      if (file) {
        const actions = rule.getActions(file)
        expect(actions).toEqual(['update'])
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
        const actions = rule.getActions(file)
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
        const actions = rule.getActions(file)
        expect(actions).toBeEmptyArray()
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for control file file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        command: ['biber', '{{$FILEPATH_0}}'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: [{ file: '$DIR_0/$NAME_0.bbl' }, { file: '$DIR_0/$NAME_0.blg' }]
      })

      done()
    })
  })
})
