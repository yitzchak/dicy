/* @flow */

import 'babel-polyfill'

import DviToPs from '../../src/Rules/DviToPs'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: DviToPs,
    parameters: [{
      filePath: 'DeviceIndependentFile.dvi'
    }],
    options
  })
}

describe('DviToPs', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'ps' })

      expect(await DviToPs.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns true if outputFormat is \'pdf\' and intermediatePostScript is set', async (done) => {
      const { rule } = await initialize({ outputFormat: 'pdf', intermediatePostScript: true })

      expect(await DviToPs.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'dvi' })

      expect(await DviToPs.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(false)

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
          '$DIR_0/$NAME_0.ps',
          '$DIR_0/$BASE_0'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.ps']
      })

      done()
    })
  })
})
