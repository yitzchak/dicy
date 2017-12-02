/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/@types/jasmine-expect/index.d.ts" />

import PsToPdf from '../../src/Rules/PsToPdf'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = PsToPdf,
  parameters = [{
    filePath: 'PostScript.ps'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('PsToPdf', () => {
  describe('isApplicable', () => {
    it('returns true if outputFormat is \'pdf\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'pdf' }
      })

      expect(await PsToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if outputFormat is not \'pdf\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await PsToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

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
        inputs: [{ file: '$FILEPATH_0', type: 'target' }],
        outputs: [{ file: '$DIR_0/$NAME_0.pdf', type: 'target' }]
      })

      done()
    })
  })
})
