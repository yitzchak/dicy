/* @flow */

import 'babel-polyfill'

import PdfToPs from '../../src/Rules/PdfToPs'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: PdfToPs,
    parameters: [{
      filePath: 'PortableDocumentFormat.pdf'
    }],
    options
  })
}

describe('PdfToPs', () => {
  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'ps' })

      expect(await PdfToPs.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      const { rule } = await initialize({ outputFormat: 'pdf' })

      expect(await PdfToPs.appliesToParameters(rule.state, 'build', 'execute', null, ...rule.parameters)).toBe(false)

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
