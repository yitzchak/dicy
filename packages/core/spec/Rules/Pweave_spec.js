/* @flow */

import 'babel-polyfill'

import Pweave from '../../src/Rules/Pweave'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = Pweave,
  filePath = 'file-types/PythonNoWeb.Pnw',
  parameters = [{
    filePath: 'PythonNoWeb.Pnw'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('Pweave', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for Pnw file.', async (done) => {
      const { rule } = await initialize({
        options: {
          pweaveCacheDirectory: 'cache',
          pweaveFigureDirectory: 'figures'
        }
      })

      expect(rule.constructCommand()).toEqual({
        args: [
          'pweave',
          '--format=tex',
          '--output={{$JOB.tex}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$JOB.tex']
      })

      done()
    })

    it('returns correct arguments and command options for Pnw file when pweaveOutputPath is set.', async (done) => {
      const { rule } = await initialize({
        options: {
          pweaveCacheDirectory: 'cache',
          pweaveFigureDirectory: 'figures',
          pweaveOutputPath: 'foo.tex'
        }
      })

      expect(rule.constructCommand()).toEqual({
        args: [
          'pweave',
          '--format=tex',
          '--output={{foo.tex}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['foo.tex']
      })

      done()
    })
  })

  it('adds --cache-directory to args when pweaveCacheDirectory is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveCacheDirectory: 'foo' }
    })

    expect(rule.constructCommand().args).toContain('--cache-directory={{foo}}')

    done()
  })

  it('adds --documentation-mode to args when pweaveDocumentationMode is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveDocumentationMode: true }
    })

    expect(rule.constructCommand().args).toContain('--documentation-mode')

    done()
  })

  it('adds --figure-directory to args when pweaveFigureDirectory is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveFigureDirectory: 'foo' }
    })

    expect(rule.constructCommand().args).toContain('--figure-directory={{foo}}')

    done()
  })

  it('adds --format to args when pweaveOutputFormat is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveOutputFormat: 'texminted' }
    })

    expect(rule.constructCommand().args).toContain('--format=texminted')

    done()
  })
})
