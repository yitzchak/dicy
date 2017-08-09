/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import PdfToPs from '../../src/Rules/PdfToPs'

describe('PdfToPs', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: PdfToPs

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreUserOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new PdfToPs(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToParameters', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      await initialize(['PortableDocumentFormat.pdf'], { outputFormat: 'ps' })

      const file = await builder.getFile('PortableDocumentFormat.pdf')
      if (file) {
        expect(await PdfToPs.appliesToParameters(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      await initialize(['PortableDocumentFormat.pdf'], { outputFormat: 'pdf' })

      const file = await builder.getFile('PortableDocumentFormat.pdf')
      if (file) {
        expect(await PdfToPs.appliesToParameters(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for pdf file.', async (done) => {
      await initialize(['PortableDocumentFormat.pdf'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'pdf2ps',
          '$DIR_0/$BASE_0',
          '$DIR_0/$NAME_0.ps'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.ps']
      })

      done()
    })
  })
})
