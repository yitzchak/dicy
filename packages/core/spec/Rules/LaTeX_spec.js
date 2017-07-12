/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import LaTeX from '../../src/Rules/LaTeX'

describe('LaTeX', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: LaTeX

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX.tex'), options)
    builder.state.env.HOME = fixturesPath
    const parameters = await builder.getFiles(parameterPaths)
    rule = new LaTeX(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToFile', () => {
    it('returns true if file type is \'LaTeX\'', async (done) => {
      await initialize(['LaTeX.tex'])

      const file = await builder.getFile('LaTeX.tex')
      if (file) {
        expect(await LaTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns true if agdaProcessor is \'none\' and file type is \'LiterateAgda\'', async (done) => {
      await initialize(['LiterateAgda.lagda'], { agdaProcessor: 'none' })

      const file = await builder.getFile('LiterateAgda.lagda')
      if (file) {
        expect(await LaTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if agdaProcessor is not \'none\' and file type is \'LiterateAgda\'', async (done) => {
      await initialize(['LiterateAgda.lagda'], { agdaProcessor: 'agda' })

      const file = await builder.getFile('LiterateAgda.lagda')
      if (file) {
        expect(await LaTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })

    it('returns true if haskellProcessor is \'none\' and file type is \'LiterateHaskell\'', async (done) => {
      await initialize(['LiterateHaskell.lhs'], { haskellProcessor: 'none' })

      const file = await builder.getFile('LiterateHaskell.lhs')
      if (file) {
        expect(await LaTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if haskellProcessor is not \'none\' and file type is \'LiterateHaskell\'', async (done) => {
      await initialize(['LiterateHaskell.lhs'], { haskellProcessor: 'lhs2TeX' })

      const file = await builder.getFile('LiterateHaskell.lhs')
      if (file) {
        expect(await LaTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('getFileActions', () => {
    beforeEach(async (done) => {
      await initialize(['LaTeX.tex'])
      done()
    })

    it('returns a run action for a LaTeX file.', async (done) => {
      const file = await builder.getFile('LaTeX.tex')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a run and updateDependencies actions for a latex log file if a rerun LaTeX instruction is found.', async (done) => {
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
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
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
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
      await initialize(['LaTeX.tex'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'pdflatex',
          '-file-line-error',
          '-interaction=batchmode',
          '-recorder',
          '$DIR_0/$BASE_0'
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
      await initialize(['LaTeX.tex'], { engine: 'foo' })

      expect(rule.constructCommand().args[0]).toEqual('foo')

      done()
    })

    it('add -output-directory to command line when outputDirectory is set.', async (done) => {
      await initialize(['LaTeX.tex'], { outputDirectory: 'foo' })

      expect(rule.constructCommand().args).toContain('-output-directory=foo')

      done()
    })

    it('add -jobname to command line when jobName is set.', async (done) => {
      await initialize(['LaTeX.tex'], { jobName: 'foo' })

      expect(rule.constructCommand().args).toContain('-jobname=foo')

      done()
    })

    it('add -synctex to command line when synctex is enabled.', async (done) => {
      await initialize(['LaTeX.tex'], { synctex: true })

      expect(rule.constructCommand().args).toContain('-synctex=1')

      done()
    })

    it('add -shell-escape to command line when shellEscape is enabled.', async (done) => {
      await initialize(['LaTeX.tex'], { shellEscape: 'enabled' })

      expect(rule.constructCommand().args).toContain('-shell-escape')

      done()
    })

    it('add -no-shell-escape to command line when shellEscape is disabled.', async (done) => {
      await initialize(['LaTeX.tex'], { shellEscape: 'disabled' })

      expect(rule.constructCommand().args).toContain('-no-shell-escape')

      done()
    })

    it('add -shell-restricted to command line when shellEscape is set to restricted.', async (done) => {
      await initialize(['LaTeX.tex'], { shellEscape: 'restricted' })

      expect(rule.constructCommand().args).toContain('-shell-restricted')

      done()
    })

    it('add -output-format to command line when dvi format is requested.', async (done) => {
      await initialize(['LaTeX.tex'], { outputFormat: 'dvi' })

      expect(rule.constructCommand().args).toContain('-output-format=dvi')

      done()
    })

    it('add -output-format to command line when ps format is requested.', async (done) => {
      await initialize(['LaTeX.tex'], { outputFormat: 'ps' })

      expect(rule.constructCommand().args).toContain('-output-format=dvi')

      done()
    })

    it('add -no-pdf to command line when dvi format is requested for xelatex.', async (done) => {
      await initialize(['LaTeX.tex'], { engine: 'xelatex', outputFormat: 'dvi' })

      expect(rule.constructCommand().args).toContain('-no-pdf')

      done()
    })
  })
})
