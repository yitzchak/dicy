/* @flow */

import 'babel-polyfill'

import PdfToPs from '../../src/Rules/PdfToPs'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = PdfToPs,
  parameters = [{
    filePath: 'PortableDocumentFormat.pdf'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('PdfToPs', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await PdfToPs.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      const { rule, options } = await initialize({
        options: { outputFormat: 'pdf' }
      })

      expect(await PdfToPs.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for pdf file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: [
          'pdf2ps',
          '{{$FILEPATH_0}}',
          '{{$DIR_0/$NAME_0.ps}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.ps']
      })

      done()
    })
  })
})
