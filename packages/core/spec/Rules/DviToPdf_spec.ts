/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/jasmine-expect/jasmine-matchers.d.ts" />

import DviToPdf from '../../src/Rules/DviToPdf'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = DviToPdf,
  parameters = [{
    filePath: 'DeviceIndependentFile.dvi'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('DviToPdf', () => {
  describe('isApplicable', () => {
    it('returns true if outputFormat is \'pdf\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'pdf' }
      })

      expect(await DviToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if outputFormat is not \'pdf\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await DviToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })

    it('returns false if outputFormat is \'pdf\' but intermediatePostScript is set.', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'pdf', intermediatePostScript: true }
      })

      expect(await DviToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for dvi file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        command: [
          'xdvipdfmx',
          '-o',
          '{{$DIR_0/$NAME_0.pdf}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: [{ file: '$FILEPATH_0', type: 'target' }],
        outputs: [{ file: '$DIR_0/$NAME_0.pdf', type: 'target' }]
      })

      done()
    })

    it('uses correct dvipdf program when dviToPdfEngine is set.', async (done) => {
      const { rule } = await initialize({
        options: { dviToPdfEngine: 'dvipdfm' }
      })

      expect(rule.constructCommand().command[0]).toEqual('dvipdfm')

      done()
    })
  })
})
