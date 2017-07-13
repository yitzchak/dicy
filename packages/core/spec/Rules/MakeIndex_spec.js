/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import MakeIndex from '../../src/Rules/MakeIndex'

describe('MakeIndex', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: MakeIndex

  async function initialize (parameterPaths: Array<string>, options: Object = {}) {
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    builder.state.env.HOME = fixturesPath
    const parameters = await builder.getFiles(parameterPaths)
    rule = new MakeIndex(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('constructCommand', () => {
    it('returns correct arguments and command options for index file.', async (done) => {
      await initialize(['IndexControlFile.idx'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'makeindex',
          '-t',
          '$DIR_0/$NAME_0.ilg',
          '-o',
          '$DIR_0/$NAME_0.ind',
          '$DIR_0/$BASE_0'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: ['$DIR_0/$NAME_0.ilg-ParsedMakeIndexLog'],
        outputs: ['$DIR_0/$NAME_0.ind', '$DIR_0/$NAME_0.ilg']
      })

      done()
    })

    it('returns correct arguments and command options for nomenclature file.', async (done) => {
      await initialize(['NomenclatureControlFile.nlo'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'makeindex',
          '-t',
          '$DIR_0/$NAME_0.nlg',
          '-o',
          '$DIR_0/$NAME_0.nls',
          '-s',
          'nomencl.ist',
          '$DIR_0/$BASE_0'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: ['$DIR_0/$NAME_0.nlg-ParsedMakeIndexLog'],
        outputs: ['$DIR_0/$NAME_0.nls', '$DIR_0/$NAME_0.nlg']
      })

      done()
    })

    it('returns correct arguments and command options for bibref file.', async (done) => {
      await initialize(['BibRefControlFile.bdx'])

      expect(rule.constructCommand()).toEqual({
        args: [
          'makeindex',
          '-t',
          '$DIR_0/$NAME_0.brlg',
          '-o',
          '$DIR_0/$NAME_0.bnd',
          '-s',
          'bibref.ist',
          '$DIR_0/$BASE_0'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: ['$DIR_0/$NAME_0.brlg-ParsedMakeIndexLog'],
        outputs: ['$DIR_0/$NAME_0.bnd', '$DIR_0/$NAME_0.brlg']
      })

      done()
    })

    it('add -c to command line when MakeIndex_compressBlanks is enabled.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_compressBlanks: true })

      expect(rule.constructCommand().args).toContain('-c')

      done()
    })

    it('add -l to command line when MakeIndex_ordering is set to \'letter\'.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_ordering: 'letter' })

      expect(rule.constructCommand().args).toContain('-l')

      done()
    })

    it('add -g to command line when MakeIndex_sorting is set to \'german\'.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_sorting: 'german' })

      expect(rule.constructCommand().args).toContain('-g')

      done()
    })

    it('add -T to command line when MakeIndex_sorting is set to \'thai\'.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_sorting: 'thai' })

      expect(rule.constructCommand().args).toContain('-T')

      done()
    })

    it('add -L to command line when MakeIndex_sorting is set to \'locale\'.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_sorting: 'locale' })

      expect(rule.constructCommand().args).toContain('-L')

      done()
    })

    it('add -r to command line when MakeIndex_automaticRanges is disabled.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_automaticRanges: false })

      expect(rule.constructCommand().args).toContain('-r')

      done()
    })

    it('add -p to command line when MakeIndex_startPage is set.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_startPage: 'odd' })

      expect(rule.constructCommand().args).toEqual(jasmine.arrayContaining(['-p', 'odd']))

      done()
    })

    it('add -s to command line when MakeIndex_style is set.', async (done) => {
      await initialize(['IndexControlFile.idx'], { MakeIndex_style: 'foo.ist' })

      expect(rule.constructCommand().args).toEqual(jasmine.arrayContaining(['-s', 'foo.ist']))

      done()
    })
  })
})
