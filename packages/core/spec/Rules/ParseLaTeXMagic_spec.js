/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseLaTeXMagic from '../../src/Rules/ParseLaTeXMagic'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = ParseLaTeXMagic,
  filePath = 'file-types/LaTeX_standalone.tex',
  parameters = [{
    filePath: 'LaTeX_standalone.tex'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, filePath, parameters, ...rest })
}

describe('ParseLaTeXMagic', () => {
  it('verifies that all log messages are successfully parsed.', async (done) => {
    const { rule } = await initialize()
    const magic = {
      jobNames: ['job-1', 'job 2', 'job-3'],
      jobs: {
        'job-1': { outputDirectory: 'output' },
        'job 2': { shellEscape: 'enabled' }
      },
      syncTeX: 'yes',
      '$PATH': ['wibble', '']
    }

    await rule.parse()

    const parsedMagic: ?File = await rule.getFile('LaTeX_standalone.tex-ParsedLaTeXMagic')

    expect(parsedMagic).toBeDefined()
    if (!parsedMagic) return

    expect(parsedMagic.value).toEqual(magic)

    done()
  })
})
