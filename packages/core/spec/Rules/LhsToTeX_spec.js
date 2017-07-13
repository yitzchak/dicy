/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import LhsToTeX from '../../src/Rules/LhsToTeX'

describe('LhsToTeX', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: LhsToTeX

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    builder.state.env.HOME = fixturesPath
    const parameters = await builder.getFiles(parameterPaths)
    rule = new LhsToTeX(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToFile', () => {
    it('returns true if file type is \'LiterateHaskell\'', async (done) => {
      await initialize(['LiterateHaskell.lhs'])

      const file = await builder.getFile('LiterateHaskell.lhs')
      if (file) {
        expect(await LhsToTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns true if literateAgdaEngine is \'lhs2TeX\' and file type is \'LiterateAgda\'', async (done) => {
      await initialize(['LiterateAgda.lagda'], { literateAgdaEngine: 'lhs2TeX' })

      const file = await builder.getFile('LiterateAgda.lagda')
      if (file) {
        expect(await LhsToTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if literateAgdaEngine is not \'lhs2TeX\' and file type is \'LiterateAgda\'', async (done) => {
      await initialize(['LiterateAgda.lagda'])

      const file = await builder.getFile('LiterateAgda.lagda')
      if (file) {
        expect(await LhsToTeX.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for lhs file.', async (done) => {
      await initialize(['LiterateHaskell.lhs'])

      expect(rule.constructCommand()).toEqual({
        args: ['lhs2TeX', '-o', '$DIR_0/$NAME_0.tex', '$DIR_0/$BASE_0'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex']
      })

      done()
    })

    it('returns correct arguments and command options for lagda file.', async (done) => {
      await initialize(['LiterateAgda.lagda'])

      expect(rule.constructCommand()).toEqual({
        args: ['lhs2TeX', '--agda', '-o', '$DIR_0/$NAME_0.tex', '$DIR_0/$BASE_0'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex']
      })

      done()
    })

    it('add --math to command line when LhsToTeX_style is set to \'math\'.', async (done) => {
      await initialize(['LiterateHaskell.lhs'], { LhsToTeX_style: 'math' })

      expect(rule.constructCommand().args).toContain('--math')

      done()
    })

    it('add --newcode to command line when LhsToTeX_style is set to \'newCode\'.', async (done) => {
      await initialize(['LiterateHaskell.lhs'], { LhsToTeX_style: 'newCode' })

      expect(rule.constructCommand().args).toContain('--newcode')

      done()
    })

    it('add --code to command line when LhsToTeX_style is set to \'code\'.', async (done) => {
      await initialize(['LiterateHaskell.lhs'], { LhsToTeX_style: 'code' })

      expect(rule.constructCommand().args).toContain('--code')

      done()
    })

    it('add --tt to command line when LhsToTeX_style is set to \'typewriter\'.', async (done) => {
      await initialize(['LiterateHaskell.lhs'], { LhsToTeX_style: 'typewriter' })

      expect(rule.constructCommand().args).toContain('--tt')

      done()
    })

    it('add --verb to command line when LhsToTeX_style is set to \'verbatim\'.', async (done) => {
      await initialize(['LiterateHaskell.lhs'], { LhsToTeX_style: 'verbatim' })

      expect(rule.constructCommand().args).toContain('--verb')

      done()
    })
  })
})
