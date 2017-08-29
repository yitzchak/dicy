/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseKnitrConcordance from '../../src/Rules/ParseKnitrConcordance'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = ParseKnitrConcordance,
  filePath = 'file-types/RNoWeb.Rnw',
  parameters = [{
    filePath: 'KnitrConcordance-concordance.tex'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, filePath, parameters, ...rest })
}

describe('ParseKnitrConcordance', () => {
  it('verifies that all concordance is successfully parsed.', async (done) => {
    const { rule } = await initialize()
    const map = {
      maps: [{
        input: 'RNoWeb.Rnw',
        output: 'RNoWeb.tex',
        mappings: [
          { input: { start: 1, end: 1 }, output: { start: 1, end: 1 } },
          { input: { start: 2, end: 2 }, output: { start: 2, end: 2 } },
          { input: { start: 3, end: 3 }, output: { start: 3, end: 3 } },
          { input: { start: 4, end: 4 }, output: { start: 4, end: 4 } },
          { input: { start: 5, end: 5 }, output: { start: 5, end: 5 } },
          { input: { start: 6, end: 6 }, output: { start: 6, end: 6 } },
          { input: { start: 7, end: 7 }, output: { start: 7, end: 7 } },
          { input: { start: 8, end: 8 }, output: { start: 8, end: 8 } },
          { input: { start: 9, end: 9 }, output: { start: 59, end: 59 } },
          { input: { start: 10, end: 10 }, output: { start: 60, end: 60 } },
          { input: { start: 11, end: 11 }, output: { start: 61, end: 61 } },
          { input: { start: 12, end: 12 }, output: { start: 62, end: 62 } },
          { input: { start: 13, end: 13 }, output: { start: 77, end: 77 } },
          { input: { start: 14, end: 14 }, output: { start: 78, end: 78 } },
          { input: { start: 15, end: 15 }, output: { start: 79, end: 79 } },
          { input: { start: 16, end: 16 }, output: { start: 80, end: 80 } },
          { input: { start: 17, end: 17 }, output: { start: 81, end: 81 } },
          { input: { start: 18, end: 18 }, output: { start: 82, end: 82 } },
          { input: { start: 19, end: 19 }, output: { start: 83, end: 83 } },
          { input: { start: 20, end: 20 }, output: { start: 90, end: 90 } }
        ]
      }]
    }

    await rule.parse()

    const parsedMap: ?File = await rule.getFile('KnitrConcordance-concordance.tex-ParsedSourceMap')

    expect(parsedMap).toBeDefined()
    if (!parsedMap) return

    expect(parsedMap.value).toEqual(map)

    done()
  })
})
