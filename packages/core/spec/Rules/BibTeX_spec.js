/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import BibTeX from '../../src/Rules/BibTeX'

describe('BibTeX', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: BibTeX

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    builder.state.env.HOME = fixturesPath
    const parameters = await builder.getFiles(parameterPaths)
    rule = new BibTeX(builder.state, 'build', 'execute', null, ...parameters)
  }

  beforeEach(async (done) => {
    await initialize(['LaTeXAuxilary.aux-ParsedLaTeXAuxilary'])
    done()
  })

  describe('getFileActions', () => {
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
      expect(rule.constructCommand()).toEqual({
        args: ['bibtex', '$DIR_0/$NAME_0.aux'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
      })

      done()
    })
  })
})
