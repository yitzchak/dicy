
import MakeGlossaries from '../../src/Rules/MakeGlossaries'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = MakeGlossaries,
  parameters = [{
    filePath: 'GlossaryControlFile.glo'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('MakeGlossaries', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for glossary file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['makeglossaries', 'GlossaryControlFile'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: [
          { file: '$DIR_0/$NAME_0.acr' },
          { file: '$DIR_0/$NAME_0.alg' },
          { file: '$DIR_0/$NAME_0.gls' },
          { file: '$DIR_0/$NAME_0.glg' }
        ]
      })

      done()
    })
  })
})
