/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import Biber from '../../src/Rules/Biber'

describe('Biber', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: Biber

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX.tex'), options)
    builder.state.env.HOME = fixturesPath
    const parameters = await builder.getFiles(parameterPaths)
    rule = new Biber(builder.state, 'build', 'execute', null, ...parameters)
  }

  beforeEach(async (done) => {
    await initialize(['BiberControlFile.bcf'])
    done()
  })

  describe('getFileActions', () => {
    it('returns a run action for a control file.', async (done) => {
      const file = await builder.getFile('BiberControlFile.bcf')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a updateDependencies action for a biber log file.', async (done) => {
      const file = await builder.getFile('BiberControlFile.blg-ParsedBiberLog')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a run action for a latex log file if a rerun biber instruction is found.', async (done) => {
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run Biber on the file: BiberControlFile and rerun LaTeX afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a no actions for a latex log file if no rerun biber instruction is found.', async (done) => {
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
      if (file) {
        file.value = {
          messages: [{
            type: 'info',
            text: 'Please (re)run Biber on the file: foo and rerun LaTeX afterwards.'
          }]
        }
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual([])
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for control file file.', async (done) => {
      expect(rule.constructCommand()).toEqual({
        args: ['biber', '$DIR_0/$BASE_0'],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.bbl', '$DIR_0/$NAME_0.blg']
      })

      done()
    })
  })
})
