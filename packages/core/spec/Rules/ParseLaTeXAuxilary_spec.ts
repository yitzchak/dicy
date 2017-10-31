/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import File from '../../src/File'
import ParseLaTeXAuxilary from '../../src/Rules/ParseLaTeXAuxilary'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = ParseLaTeXAuxilary,
  parameters = [{
    filePath: 'LaTeXAuxilary.aux'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('ParseLaTeXAuxilary', () => {
  it('verifies that all commands are successfully parsed.', async (done) => {
    const { rule } = await initialize()
    const expectedValue = {
      commands: [
        'relax',
        'abx@aux@sortscheme',
        'abx@aux@refcontext',
        'abx@aux@cite',
        'abx@aux@segm',
        '@writefile',
        '@writefile',
        '@writefile'
      ]
    }
    const parsedAuxPath = 'LaTeXAuxilary.aux-ParsedLaTeXAuxilary'

    await rule.parse()

    const parsedAux: File | undefined = await rule.getFile(parsedAuxPath)

    expect(parsedAux).toBeDefined()
    if (!parsedAux) return

    expect(parsedAux.value).toEqual(expectedValue)

    done()
  })
})
