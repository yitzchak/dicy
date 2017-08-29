/* @flow */

import 'babel-polyfill'

import LhsToTeX from '../../src/Rules/LhsToTeX'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = LhsToTeX,
  parameters = [{
    filePath: 'LiterateHaskell.lhs'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('LhsToTeX', () => {
  describe('appliesToParameters', () => {
    it('returns true if file type is \'LiterateHaskell\'', async (done) => {
      const { rule, options } = await initialize()

      expect(await LhsToTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns true if literateAgdaEngine is \'lhs2TeX\' and file type is \'LiterateAgda\'', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{ filePath: 'LiterateAgda.lagda' }],
        options: { literateAgdaEngine: 'lhs2TeX' }
      })

      expect(await LhsToTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if literateAgdaEngine is not \'lhs2TeX\' and file type is \'LiterateAgda\'', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{ filePath: 'LiterateAgda.lagda' }]
      })

      expect(await LhsToTeX.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for lhs file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['lhs2TeX', '-o', '{{$DIR_0/$NAME_0.tex}}', '{{$FILEPATH_0}}'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex']
      })

      done()
    })

    it('returns correct arguments and command options for lagda file.', async (done) => {
      const { rule } = await initialize({
        parameters: [{ filePath: 'LiterateAgda.lagda' }],
        options: { literateAgdaEngine: 'lhs2TeX' }
      })

      expect(rule.constructCommand()).toEqual({
        args: ['lhs2TeX', '--agda', '-o', '{{$DIR_0/$NAME_0.tex}}', '{{$FILEPATH_0}}'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex']
      })

      done()
    })

    it('add --math to command line when lhs2texStyle is set to \'math\'.', async (done) => {
      const { rule } = await initialize({
        options: { lhs2texStyle: 'math' }
      })

      expect(rule.constructCommand().args).toContain('--math')

      done()
    })

    it('add --newcode to command line when lhs2texStyle is set to \'newCode\'.', async (done) => {
      const { rule } = await initialize({
        options: { lhs2texStyle: 'newCode' }
      })

      expect(rule.constructCommand().args).toContain('--newcode')

      done()
    })

    it('add --code to command line when lhs2texStyle is set to \'code\'.', async (done) => {
      const { rule } = await initialize({
        options: { lhs2texStyle: 'code' }
      })

      expect(rule.constructCommand().args).toContain('--code')

      done()
    })

    it('add --tt to command line when lhs2texStyle is set to \'typewriter\'.', async (done) => {
      const { rule } = await initialize({
        options: { lhs2texStyle: 'typewriter' }
      })

      expect(rule.constructCommand().args).toContain('--tt')

      done()
    })

    it('add --verb to command line when lhs2texStyle is set to \'verbatim\'.', async (done) => {
      const { rule } = await initialize({
        options: { lhs2texStyle: 'verbatim' }
      })

      expect(rule.constructCommand().args).toContain('--verb')

      done()
    })
  })
})
