/* @flow */

import 'babel-polyfill'

import DviToSvg from '../../src/Rules/DviToSvg'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: DviToSvg,
    parameters: [{
      filePath: 'DeviceIndependentFile.dvi'
    }],
    options
  })
}

describe('DviToSvg', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'svg\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'svg' })

      expect(await DviToSvg.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'svg\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'dvi' })

      expect(await DviToSvg.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(false)

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
