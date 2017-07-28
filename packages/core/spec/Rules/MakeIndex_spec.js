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
    options.ignoreHomeOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    rule = new MakeIndex(builder.state, 'build', 'execute', null, ...parameters)
  }

  describe('appliesToParameters', () => {
    beforeEach(async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'])
      done()
    })

    it('returns true if there are no splitindex notices in the log.', async (done) => {
      rule.secondParameter.value = {
        inputs: [],
        outputs: [],
        messages: [],
        calls: []
      }

      expect(await MakeIndex.appliesToParameters(builder.state, 'build', 'execute', null, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if there are splitindex notices in the log.', async (done) => {
      rule.secondParameter.value = {
        inputs: [],
        outputs: [],
        messages: [{
          severity: 'info',
          text: 'Using splitted index at IndexControlFile.idx'
        }],
        calls: []
      }

      expect(await MakeIndex.appliesToParameters(builder.state, 'build', 'execute', null, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns false if there are splitindex calls in the log.', async (done) => {
      rule.secondParameter.value = {
        inputs: [],
        outputs: [],
        messages: [],
        calls: [{
          args: ['splitindex', 'IndexControlFile.idx'],
          options: { m: '' },
          status: 'executed (allowed)'
        }]
      }

      expect(await MakeIndex.appliesToParameters(builder.state, 'build', 'execute', null, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('getFileActions', () => {
    beforeEach(async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'])
      done()
    })

    it('returns a run action for a index control file.', async (done) => {
      const file = await builder.getFile('IndexControlFile.idx')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a updateDependencies action for a makeindex log file.', async (done) => {
      const file = await builder.getFile('IndexControlFile.ilg-ParsedMakeIndexLog')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a no actions for a latex log file.', async (done) => {
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual([])
      }

      done()
    })
  })

  describe('preEvaluate', () => {
    beforeEach(async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'])
      done()
    })

    it('retains run action if no makeindex calls present.', async (done) => {
      rule.addActions()
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          calls: []
        }
        await rule.preEvaluate()

        expect(rule.actions.has('run')).toBe(true)
      }

      done()
    })

    it('removes run action if makeindex call present.', async (done) => {
      rule.addActions()
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          calls: [{
            args: ['makeindex', 'IndexControlFile.idx'],
            options: {},
            status: 'executed (allowed)'
          }]
        }
        await rule.preEvaluate()

        expect(rule.actions.has('run')).toBe(false)
      }

      done()
    })

    it('retains run action if makeindex call failed.', async (done) => {
      rule.addActions()
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          calls: [{
            args: ['makeindex', 'IndexControlFile.idx'],
            options: {},
            status: 'clobbered'
          }]
        }
        await rule.preEvaluate()

        expect(rule.actions.has('run')).toBe(true)
      }

      done()
    })

    it('retains run action if makeindex call was for another index.', async (done) => {
      rule.addActions()
      const file = await builder.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        file.value = {
          calls: [{
            args: ['makeindex', 'foo.idx'],
            options: {},
            status: 'execute (allowed)'
          }]
        }
        await rule.preEvaluate()

        expect(rule.actions.has('run')).toBe(true)
      }

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for index file.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'])

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
      await initialize(['NomenclatureControlFile.nlo', 'LaTeX.log-ParsedLaTeXLog'])

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
      await initialize(['BibRefControlFile.bdx', 'LaTeX.log-ParsedLaTeXLog'])

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
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { MakeIndex_compressBlanks: true })

      expect(rule.constructCommand().args).toContain('-c')

      done()
    })

    it('add -l to command line when MakeIndex_ordering is set to \'letter\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { MakeIndex_ordering: 'letter' })

      expect(rule.constructCommand().args).toContain('-l')

      done()
    })

    it('add -g to command line when MakeIndex_sorting is set to \'german\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { MakeIndex_sorting: 'german' })

      expect(rule.constructCommand().args).toContain('-g')

      done()
    })

    it('add -T to command line when MakeIndex_sorting is set to \'thai\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { MakeIndex_sorting: 'thai' })

      expect(rule.constructCommand().args).toContain('-T')

      done()
    })

    it('add -L to command line when MakeIndex_sorting is set to \'locale\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { MakeIndex_sorting: 'locale' })

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
