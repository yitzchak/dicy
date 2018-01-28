/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/jasmine-expect/jasmine-matchers.d.ts" />

import PdfToPs from '../../src/Rules/PdfToPs'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = PdfToPs,
  parameters = [{
    filePath: 'PortableDocumentFormat.pdf'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('PdfToPs', () => {
  describe('isApplicable', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await PdfToPs.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'pdf' }
      })

      expect(await PdfToPs.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for pdf file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        command: [
          'pdf2ps',
          '{{$FILEPATH_0}}',
          '{{$DIR_0/$NAME_0.ps}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: [{ file: '$FILEPATH_0', type: 'target' }],
        outputs: [{ file: '$DIR_0/$NAME_0.ps', type: 'target' }]
      })

      done()
    })
  })
})
