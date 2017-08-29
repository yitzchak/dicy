/* @flow */

import 'babel-polyfill'

import DviToPs from '../../src/Rules/DviToPs'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = DviToPs,
  parameters = [{
    filePath: 'DeviceIndependentFile.dvi'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('DviToPs', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await DviToPs.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns true if outputFormat is \'pdf\' and intermediatePostScript is set', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'pdf', intermediatePostScript: true }
      })

      expect(await DviToPs.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'dvi' }
      })

      expect(await DviToPs.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for dvi file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: [
          'dvips',
          '-o',
          '{{$DIR_0/$NAME_0.ps}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.ps']
      })

      done()
    })
  })
})
