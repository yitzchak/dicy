/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/@types/jasmine-expect/index.d.ts" />

import DviToPs from '../../src/Rules/DviToPs'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = DviToPs,
  parameters = [{
    filePath: 'DeviceIndependentFile.dvi'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('DviToPs', () => {
  describe('isApplicable', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'ps' }
      })

      expect(await DviToPs.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns true if outputFormat is \'pdf\' and intermediatePostScript is set', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'pdf', intermediatePostScript: true }
      })

      expect(await DviToPs.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'dvi' }
      })

      expect(await DviToPs.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

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
          '{{$DIR_0/$NAME_0.ps}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.ps'],
        targets: [{
          parent: '$FILEPATH_0',
          filePath: '$DIR_0/$NAME_0.ps'
        }]
      })

      done()
    })
  })
})
