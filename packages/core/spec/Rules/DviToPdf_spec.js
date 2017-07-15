/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import DviToPdf from '../../src/Rules/DviToPdf'

describe('DviToPdf', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: DviToPdf

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    builder.state.env.HOME = fixturesPath
    const parameters = await builder.getFiles(parameterPaths)
    rule = new DviToPdf(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToFile', () => {
    it('returns true if outputFormat is \'pdf\'', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'pdf' })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToPdf.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if outputFormat is not \'pdf\'', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'ps' })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToPdf.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })

    it('returns false if outputFormat is \'pdf\' but producer is not a dvipdf variant.', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'pdf', producer: 'ps2pdf' })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToPdf.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for dvi file.', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'xdvipdfmx',
          '-o',
          '$DIR_0/$NAME_0.pdf',
          '$DIR_0/$BASE_0'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.pdf']
      })

      done()
    })

    it('returns correct arguments and command options for dvi file when the producer is dvipdf.', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { producer: 'dvipdf' })

      expect(rule.constructCommand()).toEqual({
        args: [
          'dvipdf',
          '$DIR_0/$BASE_0',
          '$DIR_0/$NAME_0.pdf'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.pdf']
      })

      done()
    })

    it('change command name if producer is set.', async (done) => {
      await initialize(['LaTeX_article.tex'], { producer: 'dvipdfm' })

      expect(rule.constructCommand().args[0]).toEqual('dvipdfm')

      done()
    })
  })
})
