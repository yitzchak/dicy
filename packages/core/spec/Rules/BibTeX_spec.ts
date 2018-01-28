/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/jasmine-expect/jasmine-matchers.d.ts" />

import BibTeX from '../../src/Rules/BibTeX'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = BibTeX,
  parameters = [{
    filePath: 'LaTeXAuxilary.aux'
  }, {
    filePath: 'LaTeXAuxilary.aux-ParsedLaTeXAuxilary'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('BibTeX', () => {
  describe('getFileActions', () => {
    beforeEach(async (done) => {
      await initialize()
      done()
    })

    it('returns a run action for a LaTeX aux file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeXAuxilary.aux')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a no actions for a parsed LaTeX aux file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeXAuxilary.aux-ParsedLaTeXAuxilary')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toBeEmptyArray()
      }

      done()
    })

    it('returns a updateDependencies action for a BibTeX log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('BibTeXControlFile.blg-ParsedBibTeXLog')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a run action for a latex log file if a rerun bibtex instruction is found.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run BibTeX on the file: LaTeXAuxilary and rerun LaTeX afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a no actions for a latex log file if no rerun bibtex instruction is found.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run BibTeX on the file: foo and rerun LaTeX afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toBeEmptyArray()
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for control file file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        command: ['bibtex', '{{$BASE_0}}'],
        cd: '$ROOTDIR/$DIR_0',
        severity: 'error',
        outputs: [{ file: '$DIR_0/$NAME_0.bbl' }, { file: '$DIR_0/$NAME_0.blg' }]
      })

      done()
    })

    it('returns correct arguments when bibtexEngine is set.', async (done) => {
      const { rule } = await initialize({
        options: { bibtexEngine: 'upbibtex' }
      })

      expect(rule.constructCommand().command[0]).toEqual('upbibtex')

      done()
    })

    it('adds kanji option when kanji encoding is set.', async (done) => {
      const { rule } = await initialize({
        options: { bibtexEngine: 'upbibtex', kanji: 'uptex' }
      })

      expect(rule.constructCommand().command).toContain('-kanji=uptex')

      done()
    })

    it('does not add kanji option when kanji encoding is set but engine is not a Japanese variant.', async (done) => {
      const { rule } = await initialize({
        options: { kanji: 'uptex' }
      })

      expect(rule.constructCommand().command).not.toContain('-kanji=uptex')

      done()
    })

    it('adds -kanji-internal option when kanji encoding is set.', async (done) => {
      const { rule } = await initialize({
        options: { bibtexEngine: 'upbibtex', kanjiInternal: 'uptex' }
      })

      expect(rule.constructCommand().command).toContain('-kanji-internal=uptex')

      done()
    })

    it('does not add -kanji-internal option when kanji encoding is set but engine is not a Japanese variant.', async (done) => {
      const { rule } = await initialize({
        options: { kanjiInternal: 'uptex' }
      })

      expect(rule.constructCommand().command).not.toContain('-kanji-internal=uptex')

      done()
    })
  })
})
