
import DviToSvg from '../../src/Rules/DviToSvg'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = DviToSvg,
  parameters = [{
    filePath: 'DeviceIndependentFile.dvi'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('DviToSvg', () => {
  describe('isApplicable', () => {
    it('returns true if outputFormat is \'svg\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'svg' }
      })

      expect(await DviToSvg.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if outputFormat is not \'svg\'', async (done) => {
      const { rule } = await initialize({
        options: { outputFormat: 'dvi' }
      })

      expect(await DviToSvg.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

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
        inputs: [{ file: '$FILEPATH_0', type: 'target' }],
        outputs: [{ file: '$DIR_0/$NAME_0.svg', type: 'target' }]
      })

      done()
    })
  })
})
