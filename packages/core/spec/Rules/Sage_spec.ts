/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import Sage from '../../src/Rules/Sage'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Sage,
  parameters = [{
    filePath: 'Sage.sage'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('Sage', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for sage file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        command: ['sage', '{{$BASE_0}}'],
        cd: '$ROOTDIR_0',
        severity: 'error',
        outputs: [
          { file: '$DIR_0/$NAME_0.sout' },
          { file: '$DIR_0/$NAME_0.sage.cmd' },
          { file: '$DIR_0/$NAME_0.scmd' },
          { file: '$FILEPATH_0.py' }
        ],
        globbedInputs: [{ file: '$DIR_0/sage-plots-for-$JOB.tex/*' }]
      })

      done()
    })
  })
})
