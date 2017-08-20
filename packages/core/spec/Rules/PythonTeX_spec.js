/* @flow */

import 'babel-polyfill'

// $FlowIgnore
import PythonTeX from '../../src/Rules/PythonTeX'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: PythonTeX,
    parameters: [{
      filePath: 'PythonTeX.pytxcode'
    }],
    options
  })
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
