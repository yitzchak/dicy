/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import MakeGlossaries from '../../src/Rules/MakeGlossaries'

describe('MakeGlossaries', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: MakeGlossaries

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreHomeOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new MakeGlossaries(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('constructCommand', () => {
    it('returns correct arguments and command options for glossary file.', async (done) => {
      await initialize(['GlossaryControlFile.glo'])

      expect(rule.constructCommand()).toEqual({
        args: ['makeglossaries', 'GlossaryControlFile'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: [
          '$DIR_0/$NAME_0.acr',
          '$DIR_0/$NAME_0.alg',
          '$DIR_0/$NAME_0.gls',
          '$DIR_0/$NAME_0.glg'
        ]
      })

      done()
    })
  })
})
