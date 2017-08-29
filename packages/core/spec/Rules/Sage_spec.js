/* @flow */

import 'babel-polyfill'

import Sage from '../../src/Rules/Sage'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

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
        args: ['sage', '{{$BASE_0}}'],
        cd: '$ROOTDIR_0',
        severity: 'error',
        outputs: [
          '$DIR_0/$NAME_0.sout',
          '$DIR_0/$NAME_0.sage.cmd',
          '$DIR_0/$NAME_0.scmd',
          '$FILEPATH_0.py'
        ],
        globbedOutputs: ['$DIR_0/sage-plots-for-$JOB.tex/*']
      })

      done()
    })
  })
})
