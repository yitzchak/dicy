
import File from '../../src/File'
import Rule from '../../src/Rule'
import ApplyOptions from '../../src/Rules/ApplyOptions'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({ RuleClass = ApplyOptions, ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, ...rest })
}

describe('ApplyOptions', () => {
  describe('doAssignOptions', () => {
    it('verifies that high priority configuration overrides low priority configuration.', async (done) => {
      const { rule } = await initialize()
      const yaml: File | undefined = await rule.getResolvedFile('$NAME.yaml-ParsedYAML')
      const magic: File | undefined = await rule.getResolvedFile('$BASE-ParsedLaTeXMagic')
      const applyOptions: ApplyOptions = rule as ApplyOptions

      expect(yaml).toBeDefined()
      expect(magic).toBeDefined()

      if (yaml && magic) {
        yaml.value = {
          engine: 'lualatex',
          indexStyle: 'baz.ist'
        }
        magic.value = {
          engine: 'xelatex',
          outputDirectory: 'gronk'
        }

        await applyOptions.doAssignOptions()

        expect(rule.state.options.engine).toBe('xelatex')
        expect(rule.state.options.indexStyle).toBe('baz.ist')
        expect(rule.state.options.outputDirectory).toBe('gronk')
      }

      done()
    })
  })

  describe('checkForConfigurationChange', () => {
    let loadRule: Rule
    let finalizeRule: Rule
    let otherRule: Rule
    let applyOptions: ApplyOptions

    beforeEach(async (done) => {
      const { dicy, rule } = await initialize()
      const options = rule.state.getJobOptions()

      loadRule = new Rule(rule.state, 'load', 'execute', options)
      await dicy.addRule(loadRule)

      finalizeRule = new Rule(rule.state, 'load', 'finalize', options)
      await dicy.addRule(finalizeRule)

      otherRule = new Rule(rule.state, 'build', 'execute', options)
      await dicy.addRule(otherRule)

      applyOptions = rule as ApplyOptions

      done()
    })

    it('verifies that not changing options does not remove any rules.', () => {
      applyOptions.checkForConfigurationChange({})

      expect(Array.from(applyOptions.state.rules.keys())).toEqual([
        loadRule.id,
        finalizeRule.id,
        otherRule.id
      ])
    })

    it('verifies that setting an option with `noInvalidate` does not remove any rules.', () => {
      applyOptions.checkForConfigurationChange({ phaseCycles: 20 })

      expect(Array.from(applyOptions.state.rules.keys())).toEqual([
        loadRule.id,
        finalizeRule.id,
        otherRule.id
      ])
    })

    it('verifies that setting an option without `noInvalidate` removes appropriate rules.', () => {
      applyOptions.checkForConfigurationChange({ engine: 'lualatex' })

      expect(Array.from(applyOptions.state.rules.keys())).toEqual([
        loadRule.id
      ])
    })
  })
})
