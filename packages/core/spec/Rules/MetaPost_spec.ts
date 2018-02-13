/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import MetaPost from '../../src/Rules/MetaPost'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = MetaPost,
  parameters = [{
    filePath: 'MetaPost.mp'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('MetaPost', () => {
  describe('getFileActions', () => {
    it('returns a run action for an Aymptote file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('MetaPost.mp')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a update action for parsed file listing.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('MetaPost.fls-ParsedFileListing')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['update'])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for MetaPost file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        command: [
          'mpost',
          '-file-line-error',
          '-interaction=batchmode',
          '-recorder',
          '{{$BASE_0}}'
        ],
        cd: '$ROOTDIR_0',
        severity: 'error',
        inputs: [{ file: '$DIR_0/$NAME_0.fls-ParsedFileListing' }],
        outputs: [
          { file: '$DIR_0/$NAME_0.fls' },
          { file: '$DIR_0/$NAME_0.log' }
        ]
      })

      done()
    })
  })
})
