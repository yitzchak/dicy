/* @flow */

import 'babel-polyfill'
import path from 'path'

import CopyTargetsToRoot from '../../src/Rules/CopyTargetsToRoot'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = CopyTargetsToRoot,
  filePath = 'error-warning.tex',
  parameters = [{
    filePath: 'file-types/PortableDocumentFormat.pdf'
  }],
  targets = ['file-types/PortableDocumentFormat.pdf'],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, filePath, parameters, targets, ...rest })
}

describe('CopyTargetsToRoot', () => {
  describe('appliesToParameters', () => {
    it('returns true if parameter is a target', async (done) => {
      const { rule, options } = await initialize({
        options: { copyTargetsToRoot: true }
      })

      rule.addTarget(rule.firstParameter.filePath)
      expect(await CopyTargetsToRoot.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if parameter is a virtual file', async (done) => {
      const filePath = 'file-types/foo.bar-ParsedLaTeXLog'
      const { rule, options } = await initialize({
        options: { copyTargetsToRoot: true },
        parameters: [{ filePath }]
      })

      rule.addTarget(filePath)
      expect(await CopyTargetsToRoot.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns false if parameter is already in the root', async (done) => {
      const filePath = 'error-warning.log'
      const { rule, options } = await initialize({
        options: { copyTargetsToRoot: true },
        parameters: [{ filePath }]
      })

      rule.addTarget(filePath)
      expect(await CopyTargetsToRoot.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns false if parameter is not a target', async (done) => {
      const { rule, options } = await initialize({
        options: { copyTargetsToRoot: true }
      })

      expect(await CopyTargetsToRoot.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns false if copyTargetsToRoot is not set', async (done) => {
      const { rule, options } = await initialize()

      rule.addTarget(rule.firstParameter.filePath)
      expect(await CopyTargetsToRoot.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('initialize', () => {
    it('replaces input target with destination path', async (done) => {
      const { rule } = await initialize({
        options: { copyTargetsToRoot: true }
      })

      expect(rule.state.targets).not.toContain(rule.firstParameter.filePath)
      expect(await rule.state.targets).toContain('PortableDocumentFormat.pdf')

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

      expect(await rule.run()).toBe(true)
      expect(rule.firstParameter.copy).toHaveBeenCalledWith(destination)

      done()
    })
  })
})
