/* @flow */

import 'babel-polyfill'

import Pweave from '../../src/Rules/Pweave'
import { initializeRule } from '../helpers'

async function initialize (options: Object = {}) {
  return initializeRule({
    RuleClass: Pweave,
    filePath: 'file-types/PythonNoWeb.Pnw',
    parameters: [{
      filePath: 'PythonNoWeb.Pnw'
    }],
    options
  })
}

describe('Pweave', () => {
  describe('constructCommand', () => {
    it('returns correct arguments and command options for Pnw file.', async (done) => {
      const { rule } = await initialize({
        pweaveCacheDirectory: 'cache',
        pweaveFigureDirectory: 'figures'
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
        pweaveCacheDirectory: 'cache',
        pweaveFigureDirectory: 'figures',
        pweaveOutputPath: 'foo.tex'
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
    const { rule } = await initialize({ pweaveCacheDirectory: 'foo' })

    expect(rule.constructCommand().args).toContain('--cache-directory={{foo}}')

    done()
  })

  it('adds --documentation-mode to args when pweaveDocumentationMode is set.', async (done) => {
    const { rule } = await initialize({ pweaveDocumentationMode: true })

    expect(rule.constructCommand().args).toContain('--documentation-mode')

    done()
  })

  it('adds --figure-directory to args when pweaveFigureDirectory is set.', async (done) => {
    const { rule } = await initialize({ pweaveFigureDirectory: 'foo' })

    expect(rule.constructCommand().args).toContain('--figure-directory={{foo}}')

    done()
  })

  it('adds --format to args when pweaveOutputFormat is set.', async (done) => {
    const { rule } = await initialize({ pweaveOutputFormat: 'texminted' })

    expect(rule.constructCommand().args).toContain('--format=texminted')

    done()
  })
})
