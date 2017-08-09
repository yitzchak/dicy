/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import BibTeX from '../../src/Rules/BibTeX'

describe('BibTeX', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: BibTeX

  async function initialize (options: Object = {}) {
    options.ignoreUserOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(['LaTeXAuxilary.aux', 'LaTeXAuxilary.aux-ParsedLaTeXAuxilary'])
    rule = new BibTeX(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('getFileActions', () => {
    beforeEach(async (done) => {
      await initialize()
      done()
    })

    it('returns a run action for a LaTeX aux file.', async (done) => {
      const file = await builder.getFile('LaTeXAuxilary.aux')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a no actions for a parsed LaTeX aux file.', async (done) => {
      const file = await builder.getFile('LaTeXAuxilary.aux-ParsedLaTeXAuxilary')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual([])
      }

      done()
    })

    it('returns a updateDependencies action for a BibTeX log file.', async (done) => {
      const file = await builder.getFile('BibTeXControlFile.blg-ParsedBibTeXLog')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a run action for a latex log file if a rerun bibtex instruction is found.', async (done) => {
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
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
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run BibTeX on the file: foo and rerun LaTeX afterwards.'
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
      await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['bibtex', '$DIR_0/$BASE_0'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
      })

      done()
    })

    it('returns correct arguments when bibtexEngine is set.', async (done) => {
      await initialize({ bibtexEngine: 'upbibtex' })

      expect(rule.constructCommand().args[0]).toEqual('upbibtex')

      done()
    })

    it('adds kanji option when kanji encoding is set.', async (done) => {
      await initialize({ bibtexEngine: 'upbibtex', kanji: 'uptex' })

      expect(rule.constructCommand().args).toContain('-kanji=uptex')

      done()
    })

    it('does not add kanji option when kanji encoding is set but engine is not a Japanese variant.', async (done) => {
      await initialize({ kanji: 'uptex' })

      expect(rule.constructCommand().args).not.toContain('-kanji=uptex')

      done()
    })

    it('adds -kanji-internal option when kanji encoding is set.', async (done) => {
      await initialize({ bibtexEngine: 'upbibtex', kanjiInternal: 'uptex' })

      expect(rule.constructCommand().args).toContain('-kanji-internal=uptex')

      done()
    })

    it('does not add -kanji-internal option when kanji encoding is set but engine is not a Japanese variant.', async (done) => {
      await initialize({ kanjiInternal: 'uptex' })

      expect(rule.constructCommand().args).not.toContain('-kanji-internal=uptex')

      done()
    })
  })
})
