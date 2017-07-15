/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import DviToPs from '../../src/Rules/DviToPs'

describe('DviToPs', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: DviToPs

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreHomeOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new DviToPs(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToFile', () => {
    it('returns true if outputFormat is \'ps\'', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'ps' })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToPs.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns true if outputFormat is \'pdf\' and intermediatePostScript is set', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'pdf', intermediatePostScript: true })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToPs.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if outputFormat is not \'ps\'', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'dvi' })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToPs.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for dvi file.', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'dvips',
          '-o',
          '$DIR_0/$NAME_0.ps',
          '$DIR_0/$BASE_0'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.ps']
      })

      done()
    })
  })
})
