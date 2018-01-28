/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import Pweave from '../../src/Rules/Pweave'
import { initializeRule, RuleDefinition } from '../helpers'

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
        command: [
          'pweave',
          '--format=tex',
          '--output={{$JOB.tex}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: [{ file: '$JOB.tex' }]
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
        command: [
          'pweave',
          '--format=tex',
          '--output={{foo.tex}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: [{ file: 'foo.tex' }]
      })

      done()
    })
  })

  it('adds --cache-directory to command when pweaveCacheDirectory is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveCacheDirectory: 'foo' }
    })

    expect(rule.constructCommand().command).toContain('--cache-directory={{foo}}')

    done()
  })

  it('adds --documentation-mode to command when pweaveDocumentationMode is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveDocumentationMode: true }
    })

    expect(rule.constructCommand().command).toContain('--documentation-mode')

    done()
  })

  it('adds --figure-directory to command when pweaveFigureDirectory is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveFigureDirectory: 'foo' }
    })

    expect(rule.constructCommand().command).toContain('--figure-directory={{foo}}')

    done()
  })

  it('adds --kernel to command when pweaveKernel is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveKernel: 'foo' }
    })

    expect(rule.constructCommand().command).toContain('--kernel=foo')

    done()
  })

  it('adds --format to command when pweaveOutputFormat is set.', async (done) => {
    const { rule } = await initialize({
      options: { pweaveOutputFormat: 'texminted' }
    })

    expect(rule.constructCommand().command).toContain('--format=texminted')

    done()
  })
})
