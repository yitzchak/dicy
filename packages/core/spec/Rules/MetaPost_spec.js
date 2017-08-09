/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import MetaPost from '../../src/Rules/MetaPost'

describe('MetaPost', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: MetaPost

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreUserOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new MetaPost(builder.state, 'build', 'execute', null, ...parameters)
  }

  beforeEach(async (done) => {
    await initialize(['LaTeX_article.tex'])
    done()
  })

  describe('getFileActions', () => {
    it('returns a run action for an Aymptote file.', async (done) => {
      const file = await builder.getFile('MetaPost.mp')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a updateDependencies action for parsed file listing.', async (done) => {
      const file = await builder.getFile('MetaPost.fls-ParsedFileListing')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for MetaPost file.', async (done) => {
      expect(rule.constructCommand()).toEqual({
        args: [
          'mpost',
          '-file-line-error',
          '-interaction=batchmode',
          '-recorder',
          '$BASE_0'
        ],
        cd: '$ROOTDIR_0',
        severity: 'error',
        inputs: ['$DIR_0/$NAME_0.fls-ParsedFileListing'],
        outputs: ['$DIR_0/$NAME_0.fls', '$DIR_0/$NAME_0.log']
      })

      done()
    })
  })
})
