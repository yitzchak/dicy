/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import Sage from '../../src/Rules/Sage'

describe('Sage', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: Sage

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreHomeOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new Sage(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('constructCommand', () => {
    it('returns correct arguments and command options for sage file.', async (done) => {
      await initialize(['Sage.sage'])

      expect(rule.constructCommand()).toEqual({
        args: ['sage', '$BASE_0'],
        cd: '$ROOTDIR_0',
        severity: 'error',
        outputs: [
          '$DIR_0/$NAME_0.sout',
          '$DIR_0/$NAME_0.sage.cmd',
          '$DIR_0/$NAME_0.scmd',
          '$DIR_0/$BASE_0.py'
        ],
        globbedOutputs: ['$DIR_0/sage-plots-for-$NAME_0.tex/*']
      })

      done()
    })
  })
})
