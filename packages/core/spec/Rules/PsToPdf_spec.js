/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import PsToPdf from '../../src/Rules/PsToPdf'

describe('PsToPdf', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: PsToPdf

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreHomeOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new PsToPdf(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'pdf\'', async (done) => {
      await initialize(['PostScript.ps'], { outputFormat: 'pdf' })

      const file = await builder.getFile('PostScript.ps')
      if (file) {
        expect(await PsToPdf.appliesToParameters(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if outputFormat is not \'pdf\'', async (done) => {
      await initialize(['PostScript.ps'], { outputFormat: 'ps' })

      const file = await builder.getFile('PostScript.ps')
      if (file) {
        expect(await PsToPdf.appliesToParameters(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for ps file.', async (done) => {
      await initialize(['PostScript.ps'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'ps2pdf',
          '$DIR_0/$BASE_0',
          '$DIR_0/$NAME_0.pdf'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.pdf']
      })

      done()
    })
  })
})
