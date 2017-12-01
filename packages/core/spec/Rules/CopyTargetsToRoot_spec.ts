/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/@types/jasmine-expect/index.d.ts" />

import * as path from 'path'

import CopyTargetsToRoot from '../../src/Rules/CopyTargetsToRoot'
import Rule from '../../src/Rule'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = CopyTargetsToRoot,
  filePath = 'error-warning.tex',
  parameters = [{
    filePath: 'file-types/PortableDocumentFormat.pdf'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, filePath, parameters, ...rest })
}

describe('CopyTargetsToRoot', () => {
  describe('isApplicable', () => {
    it('returns true if parameter is a target', async (done) => {
      const { rule } = await initialize({
        options: { copyTargetsToRoot: true }
      })
      const otherRule = new Rule(rule.state, 'build', 'execute', rule.options)

      await otherRule.getOutput(rule.firstParameter.filePath, 'target')

      expect(await CopyTargetsToRoot.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if parameter is a virtual file', async (done) => {
      const filePath = 'file-types/foo.bar-ParsedLaTeXLog'
      const { rule } = await initialize({
        options: { copyTargetsToRoot: true },
        parameters: [{ filePath }]
      })

      const otherRule = new Rule(rule.state, 'build', 'execute', rule.options)

      await otherRule.getOutput(filePath, 'target')
      expect(await CopyTargetsToRoot.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })

    it('returns false if parameter is already in the root', async (done) => {
      const filePath = 'error-warning.log'
      const { rule } = await initialize({
        options: { copyTargetsToRoot: true },
        parameters: [{ filePath }]
      })

      const otherRule = new Rule(rule.state, 'build', 'execute', rule.options)

      await otherRule.getOutput(filePath, 'target')
      expect(await CopyTargetsToRoot.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })

    it('returns false if parameter is not a target', async (done) => {
      const { rule } = await initialize({
        options: { copyTargetsToRoot: true }
      })

      expect(await CopyTargetsToRoot.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })

    it('returns false if copyTargetsToRoot is not set', async (done) => {
      const { rule } = await initialize()

      const otherRule = new Rule(rule.state, 'build', 'execute', rule.options)

      await otherRule.getOutput(rule.firstParameter.filePath, 'target')
      expect(await CopyTargetsToRoot.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })
  })

  describe('run', () => {
    it('copies target to root path.', async (done) => {
      const { rule } = await initialize({
        options: { copyTargetsToRoot: true }
      })
      const destination = path.join(rule.rootPath, 'PortableDocumentFormat.pdf')

      spyOn(rule.firstParameter, 'copy')
      const otherRule = new Rule(rule.state, 'build', 'execute', rule.options)

      await otherRule.getOutput(rule.firstParameter.filePath, 'target')

      expect(await rule.run()).toBeTrue()
      expect(rule.firstParameter.copy).toHaveBeenCalledWith(destination)
      // expect(rule.targets.map(file => file.filePath)).toEqual(['PortableDocumentFormat.pdf'])

      done()
    })
  })
})
