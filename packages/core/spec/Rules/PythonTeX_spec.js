/* @flow */

import 'babel-polyfill'

// $FlowIgnore
import PythonTeX from '../../src/Rules/PythonTeX'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = PythonTeX,
  parameters = [{
    filePath: 'PythonTeX.pytxcode'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('PythonTeX', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for PythonTeX file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: ['pythontex', '{{$NAME_0}}'],
        cd: '$ROOTDIR_0',
        severity: 'error',
        globbedOutputs: ['$DIR_0/pythontex-files-$NAME_0/*']
      })

      done()
    })
  })
})
