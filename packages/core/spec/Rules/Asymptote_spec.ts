/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import Asymptote from '../../src/Rules/Asymptote'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Asymptote,
  parameters = [{
    filePath: 'Asymptote.asy'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('Asymptote', () => {
  describe('getFileActions', () => {
    it('returns a run action for an Aymptote file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('Asymptote.asy')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a update action for Asymptote stdout.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('Asymptote.log-ParsedAsymptoteStdOut')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['update'])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for Asymptote file.', async (done) => {
      const { rule } = await initialize()

      /* eslint no-template-curly-in-string: 0 */
      expect(rule.constructCommand()).toEqual({
        command: ['asy', '-vv', '{{$BASE_0}}'],
        cd: '$ROOTDIR_0',
        severity: 'error',
        inputs: [{ file: '$DIR_0/$NAME_0.log-ParsedAsymptoteStdOut' }],
        outputs: [
          { file: '$DIR_0/${NAME_0}_0.pdf' },
          { file: '$DIR_0/${NAME_0}_0.eps' },
          { file: '$DIR_0/$NAME_0.pre' }
        ],
        stdout: '$DIR_0/$NAME_0.log-AsymptoteStdOut',
        stderr: '$DIR_0/$NAME_0.log-AsymptoteStdErr'
      })

      done()
    })
  })
})
