/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/jasmine-expect/jasmine-matchers.d.ts" />

import BibToGls from '../../src/Rules/BibToGls'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = BibToGls,
  parameters = [{
    filePath: 'LaTeXAuxilary.aux'
  }, {
    filePath: 'LaTeXAuxilary.aux-ParsedLaTeXAuxilary'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('BibToGls', () => {
  describe('getActions', () => {
    beforeEach(async (done) => {
      await initialize()
      done()
    })

    it('returns a run action for a LaTeX aux file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeXAuxilary.aux')

      if (file) {
        const actions = rule.getActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    // it('returns a no actions for a parsed LaTeX aux file.', async (done) => {
    //   const { rule } = await initialize()
    //   const file = await rule.getFile('LaTeXAuxilary.aux-ParsedLaTeXAuxilary')
    //
    //   if (file) {
    //     const actions = rule.getActions(file)
    //     expect(actions).toBeEmptyArray()
    //   }
    //
    //   done()
    // })

    it('returns a update action for a BibToGls log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('BibToGlsLog.gelg-ParsedBibToGlsLog')

      if (file) {
        const actions = rule.getActions(file)
        expect(actions).toEqual(['update'])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for control file file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        command: ['bib2gls', '-t', '{{$NAME_0.gelg}}', '{{$NAME_0}}'],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: [{ file: '$DIR_0/$NAME_0.gelg-ParsedBibToGlsLog' }],
        outputs: [{ file: '$DIR_0/$NAME_0.gelg' }]
      })

      done()
    })
  })
})
