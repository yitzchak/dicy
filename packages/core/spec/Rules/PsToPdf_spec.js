/* @flow */

import 'babel-polyfill'

import PsToPdf from '../../src/Rules/PsToPdf'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: PsToPdf,
    parameters: [{
      filePath: 'PostScript.ps'
    }],
    options
  })
}

describe('PsToPdf', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'pdf\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'pdf' })

      expect(await PsToPdf.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'pdf\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'ps' })

      expect(await PsToPdf.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for ps file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: [
          'ps2pdf',
          '$DIR_0/$BASE_0',
          '$DIR_0/$NAME_0.pdf'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.pdf']
      })

      done()
    })
  })
})
