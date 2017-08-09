/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import Agda from '../../src/Rules/Agda'

describe('Agda', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: Agda

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreUserOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new Agda(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToParameters', () => {
    it('returns true if literateAgdaEngine is \'agda\'', async (done) => {
      await initialize(['LiterateAgda.lagda'])

      const file = await builder.getFile('LiterateAgda.lagda')
      if (file) {
        expect(await Agda.appliesToParameters(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if literateAgdaEngine is not \'agda\'', async (done) => {
      await initialize(['LiterateAgda.lagda'], { literateAgdaEngine: 'lhs2TeX' })

      const file = await builder.getFile('LiterateAgda.lagda')
      if (file) {
        expect(await Agda.appliesToParameters(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for lagda file.', async (done) => {
      await initialize(['LiterateAgda.lagda'])

      expect(rule.constructCommand()).toEqual({
        args: ['agda', '--latex', '--latex-dir=.', '$BASE_0'],
        cd: '$ROOTDIR/$DIR_0',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.tex', '$DIR_0/$NAME_0.agdai', '$DIR_0/agda.sty']
      })

      done()
    })
  })
})
