/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import DviToSvg from '../../src/Rules/DviToSvg'

describe('DviToSvg', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: DviToSvg

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    options.ignoreHomeOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new DviToSvg(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToFile', () => {
    it('returns true if outputFormat is \'svg\'', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'svg' })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToSvg.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(true)
      }

      done()
    })

    it('returns false if outputFormat is not \'svg\'', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'], { outputFormat: 'dvi' })

      const file = await builder.getFile('DeviceIndependentFile.dvi')
      if (file) {
        expect(await DviToSvg.appliesToFile(builder.state, 'build', 'execute', null, file)).toBe(false)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for dvi file.', async (done) => {
      await initialize(['DeviceIndependentFile.dvi'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'dvisvgm',
          '-o',
          '$DIR_0/$NAME_0.svg',
          '$DIR_0/$BASE_0'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.svg']
      })

      done()
    })
  })
})
