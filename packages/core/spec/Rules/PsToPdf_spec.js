/* @flow */

import 'babel-polyfill'

import PsToPdf from '../../src/Rules/PsToPdf'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = PsToPdf,
  parameters = [{
    filePath: 'PostScript.ps'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('PsToPdf', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'pdf\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'pdf' }
      })

      expect(await PsToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'pdf\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await PsToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for ps file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: [
          'ps2pdf',
          '{{$FILEPATH_0}}',
          '{{$DIR_0/$NAME_0.pdf}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.pdf']
      })

      done()
    })
  })
})
