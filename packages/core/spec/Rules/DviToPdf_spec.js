/* @flow */

import 'babel-polyfill'

import DviToPdf from '../../src/Rules/DviToPdf'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = DviToPdf,
  parameters = [{
    filePath: 'DeviceIndependentFile.dvi'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('DviToPdf', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'pdf\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'pdf' }
      })

      expect(await DviToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'pdf\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await DviToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns false if outputFormat is \'pdf\' but intermediatePostScript is set.', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'pdf', intermediatePostScript: true }
      })

      expect(await DviToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for dvi file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: [
          'xdvipdfmx',
          '-o',
          '{{$DIR_0/$NAME_0.pdf}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.pdf']
      })

      done()
    })

    it('uses correct dvipdf program when dviToPdfEngine is set.', async (done) => {
      const { rule } = await initialize({
        options: { dviToPdfEngine: 'dvipdfm' }
      })

      expect(rule.constructCommand().args[0]).toEqual('dvipdfm')

      done()
    })
  })
})
