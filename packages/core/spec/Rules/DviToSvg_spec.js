/* @flow */

import 'babel-polyfill'

import DviToSvg from '../../src/Rules/DviToSvg'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = DviToSvg,
  parameters = [{
    filePath: 'DeviceIndependentFile.dvi'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('DviToSvg', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'svg\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'svg' }
      })

      expect(await DviToSvg.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'svg\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'dvi' }
      })

      expect(await DviToSvg.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for dvi file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: [
          'dvisvgm',
          '-o',
          '{{$DIR_0/$NAME_0.svg}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.svg']
      })

      done()
    })
  })
})
