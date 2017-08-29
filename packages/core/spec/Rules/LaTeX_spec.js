/* @flow */

import 'babel-polyfill'

import LaTeX from '../../src/Rules/LaTeX'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = LaTeX,
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, ...rest })
}

describe('LaTeX', () => {
  describe('appliesToParameters', () => {
    it('returns true if file type is \'LaTeX\'', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }]
      })

      expect(await LaTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns true if file type is \'LaTeX\' and sub type is standalone is master document.', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'LaTeX_standalone.tex'
        }]
      })

      expect(await LaTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns false if file type is \'LaTeX\' and sub type is standalone but not master document.', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }]
      })
      const parameters = await rule.getFiles(['LaTeX_standalone.tex'])

      expect(await LaTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...parameters)).toBe(false)

      done()
    })

    it('returns true if literateAgdaEngine is \'none\' and file type is \'LiterateAgda\'', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'LiterateAgda.lagda'
        }],
        options: { literateAgdaEngine: 'none' }
      })

      expect(await LaTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if literateAgdaEngine is not \'none\' and file type is \'LiterateAgda\'', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'LiterateAgda.lagda'
        }],
        options: { literateAgdaEngine: 'agda' }
      })

      expect(await LaTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns true if literateHaskellEngine is \'none\' and file type is \'LiterateHaskell\'', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'LiterateHaskell.lhs'
        }],
        options: { literateHaskellEngine: 'none' }
      })

      expect(await LaTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if literateHaskellEngine is not \'none\' and file type is \'LiterateHaskell\'', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'LiterateHaskell.lhs'
        }],
        options: { literateHaskellEngine: 'lhs2TeX' }
      })

      expect(await LaTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('getFileActions', () => {
    it('returns a run action for a LaTeX file.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }]
      })
      const file = await rule.getFile('LaTeX_article.tex')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a run and updateDependencies actions for a latex log file if a rerun LaTeX instruction is found.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }]
      })
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run Biber on the file: BiberControlFile and rerun LaTeX afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies', 'run'])
      }

      done()
    })

    it('returns an updateDependencies action for a latex log file if no rerun LaTeX instruction is found.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }]
      })
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run Biber on the file: BiberControlFile and rerun foo afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for LaTeX file.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }]
      })

      expect(rule.constructCommand()).toEqual({
        args: [
          'pdflatex',
          '-file-line-error',
          '-interaction=batchmode',
          '-recorder',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: ['$OUTDIR/$JOB.aux'],
        outputs: [
          '$OUTDIR/$JOB.aux',
          '$OUTDIR/$JOB.fls',
          '$OUTDIR/$JOB.log',
          '$OUTDIR/$JOB.synctex.gz'
        ]
      })

      done()
    })

    it('change command name if engine is set.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { engine: 'foo' }
      })

      expect(rule.constructCommand().args[0]).toEqual('foo')

      done()
    })

    it('add -output-directory to command line when outputDirectory is set.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { outputDirectory: 'foo' }
      })

      expect(rule.constructCommand().args).toContain('-output-directory=foo')

      done()
    })

    it('add -jobname to command line when jobName is set.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { jobName: 'foo' }
      })

      expect(rule.constructCommand().args).toContain('-jobname=foo')

      done()
    })

    it('add -synctex to command line when synctex is enabled.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { synctex: true }
      })

      expect(rule.constructCommand().args).toContain('-synctex=1')

      done()
    })

    it('add -shell-escape to command line when shellEscape is enabled.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { shellEscape: 'enabled' }
      })

      expect(rule.constructCommand().args).toContain('-shell-escape')

      done()
    })

    it('add -no-shell-escape to command line when shellEscape is disabled.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { shellEscape: 'disabled' }
      })

      expect(rule.constructCommand().args).toContain('-no-shell-escape')

      done()
    })

    it('add -shell-restricted to command line when shellEscape is set to restricted.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { shellEscape: 'restricted' }
      })

      expect(rule.constructCommand().args).toContain('-shell-restricted')

      done()
    })

    it('add -output-format to command line when dvi format is requested.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { outputFormat: 'dvi' }
      })

      expect(rule.constructCommand().args).toContain('-output-format=dvi')

      done()
    })

    it('add -output-format to command line when ps format is requested.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { outputFormat: 'ps' }
      })

      expect(rule.constructCommand().args).toContain('-output-format=dvi')

      done()
    })

    it('add -no-pdf to command line when dvi format is requested for xelatex.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { engine: 'xelatex', outputFormat: 'dvi' }
      })

      expect(rule.constructCommand().args).toContain('-no-pdf')

      done()
    })

    it('adds kanji option when kanji encoding is set.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { engine: 'uplatex', kanji: 'uptex' }
      })

      expect(rule.constructCommand().args).toContain('-kanji=uptex')

      done()
    })

    it('does not add kanji option when kanji encoding is set but engine is not a Japanese variant.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { kanji: 'uptex' }
      })

      expect(rule.constructCommand().args).not.toContain('-kanji=uptex')

      done()
    })

    it('adds -kanji-internal option when kanji encoding is set.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { engine: 'uplatex', kanjiInternal: 'uptex' }
      })

      expect(rule.constructCommand().args).toContain('-kanji-internal=uptex')

      done()
    })

    it('does not add -kanji-internal option when kanji encoding is set but engine is not a Japanese variant.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'LaTeX_article.tex'
        }],
        options: { kanjiInternal: 'uptex' }
      })

      expect(rule.constructCommand().args).not.toContain('-kanji-internal=uptex')

      done()
    })
  })
})
