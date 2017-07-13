/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import Asymptote from '../../src/Rules/Asymptote'

describe('Asymptote', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: Asymptote

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    builder.state.env.HOME = fixturesPath
    const parameters = await builder.getFiles(parameterPaths)
    rule = new Asymptote(builder.state, 'build', 'execute', null, ...parameters)
  }

  beforeEach(async (done) => {
    await initialize(['LaTeX_article.tex'])
    done()
  })

  describe('getFileActions', () => {
    it('returns a run action for an Aymptote file.', async (done) => {
      const file = await builder.getFile('Asymptote.asy')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a updateDependencies action for a BibTeX log file.', async (done) => {
      const file = await builder.getFile('Asymptote.log-ParsedAsymptoteStdOut')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for Asymptote file.', async (done) => {
      /* eslint no-template-curly-in-string: 0 */
      expect(rule.constructCommand()).toEqual({
        args: ['asy', '-vv', '$BASE_0'],
        cd: '$ROOTDIR_0',
        severity: 'error',
        outputs: [
          '$DIR_0/${NAME_0}_0.pdf',
          '$DIR_0/${NAME_0}_0.eps',
          '$DIR_0/$NAME_0.pre'
        ],
        stdout: '$DIR_0/$NAME_0.log-AsymptoteStdOut',
        stderr: '$DIR_0/$NAME_0.log-AsymptoteStdErr'
      })

      done()
    })
  })
})
