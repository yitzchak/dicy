/* @flow */

import 'babel-polyfill'
import path from 'path'

import DiCy from '../../src/DiCy'
import MakeIndex from '../../src/Rules/MakeIndex'

describe('MakeIndex', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let builder: DiCy
  let rule: MakeIndex

  async function initialize (parameterPaths: Array<string>, options: Object = {}, values: Array<?Object> = []) {
    options.ignoreUserOptions = true
    builder = await DiCy.create(path.resolve(fixturesPath, 'file-types', 'LaTeX_article.tex'), options)
    const parameters = await builder.getFiles(parameterPaths)
    for (let i = 0; i < values.length; i++) {
      if (values[i]) parameters[i].value = values[i]
    }
    rule = new MakeIndex(builder.state, 'build', 'execute', null, ...parameters)
    await rule.initialize()
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
          options: { makeindex: '' },
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

    it('returns a updateDependencies action for a mendex log file.', async (done) => {
      const file = await builder.getFile('IndexControlFile.ilg-ParsedMendexLog')
      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual(['updateDependencies'])
      }

      done()
    })

    it('returns a updateDependencies action for a xindy log file.', async (done) => {
      const file = await builder.getFile('IndexControlFile.ilg-ParsedXindyLog')
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

  describe('initialize', () => {
    it('verifies that makeindex call overrides default options.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['makeindex', 'IndexControlFile.idx'],
              options: {
                c: true,
                g: true,
                l: true,
                o: 'foo.ind',
                p: 'odd',
                r: true,
                s: 'foo.ist',
                t: 'foo.ilg'
              },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.indexAutomaticRanges).toBe(false)
      expect(rule.options.indexCompressBlanks).toBe(true)
      expect(rule.options.indexLogPath).toBe('foo.ilg')
      expect(rule.options.indexOutputPath).toBe('foo.ind')
      expect(rule.options.indexOrdering).toBe('letter')
      expect(rule.options.indexSorting).toBe('german')
      expect(rule.options.indexStartPage).toBe('odd')
      expect(rule.options.indexStyle).toBe('foo.ist')

      done()
    })

    it('verifies that makeindex call with -T option results in Thai sorting.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['makeindex', 'IndexControlFile.idx'],
              options: { T: true },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.indexSorting).toBe('thai')
      done()
    })

    it('verifies that makeindex call with -L option results in locale sorting.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['makeindex', 'IndexControlFile.idx'],
              options: { L: true },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.indexSorting).toBe('locale')
      done()
    })

    it('verifies that makeindex call on a different index does not override default options.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['makeindex', 'foo.idx'],
              options: {
                c: true
              },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.indexCompressBlanks).not.toBe(false)

      done()
    })

    it('verifies that mendex call overrides default options and sets indexEngine.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['mendex', 'IndexControlFile.idx'],
              options: {
                d: 'foo',
                f: true,
                I: 'euc',
                U: true
              },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.indexDictionary).toBe('foo')
      expect(rule.options.indexEngine).toBe('mendex')
      expect(rule.options.indexForceKanji).toBe(true)
      expect(rule.options.kanji).toBe('utf8')
      expect(rule.options.kanjiInternal).toBe('euc')

      done()
    })

    it('verifies that mendex call with -E option results in kanji setting of euc.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['mendex', 'IndexControlFile.idx'],
              options: { E: true },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.kanji).toBe('euc')

      done()
    })

    it('verifies that mendex call with -J option results in kanji setting of jis.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['mendex', 'IndexControlFile.idx'],
              options: { J: true },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.kanji).toBe('jis')

      done()
    })

    it('verifies that mendex call with -S option results in kanji setting of sjis.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'],
        {}, [
          null, {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['mendex', 'IndexControlFile.idx'],
              options: { S: true },
              status: 'executed (allowed)'
            }]
          }
        ])

      expect(rule.options.kanji).toBe('sjis')

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

    it('use correct engine when indexEngine is set.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'texindy' })

      expect(rule.constructCommand().args[0]).toBe('texindy')

      done()
    })

    it('add -c to command line when indexCompressBlanks is enabled.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexCompressBlanks: true })

      expect(rule.constructCommand().args).toContain('-c')

      done()
    })

    it('add -l to command line when indexOrdering is set to \'letter\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexOrdering: 'letter' })

      expect(rule.constructCommand().args).toContain('-l')

      done()
    })

    it('add -g to command line when indexSorting is set to \'german\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexSorting: 'german' })

      expect(rule.constructCommand().args).toContain('-g')

      done()
    })

    it('add -T to command line when indexSorting is set to \'thai\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexSorting: 'thai' })

      expect(rule.constructCommand().args).toContain('-T')

      done()
    })

    it('add -L to command line when indexSorting is set to \'locale\'.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexSorting: 'locale' })

      expect(rule.constructCommand().args).toContain('-L')

      done()
    })

    it('add -r to command line when indexAutomaticRanges is disabled.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexAutomaticRanges: false })

      expect(rule.constructCommand().args).toContain('-r')

      done()
    })

    it('add -p to command line when indexStartPage is set.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexStartPage: 'odd' })

      expect(rule.constructCommand().args).toEqual(jasmine.arrayContaining(['-p', 'odd']))

      done()
    })

    it('add -s to command line when indexStyle is set.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexStyle: 'foo.ist' })

      expect(rule.constructCommand().args).toEqual(jasmine.arrayContaining(['-s', 'foo.ist']))

      done()
    })

    it('add -E to command line when kanji is set to euc.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'mendex', kanji: 'euc' })

      expect(rule.constructCommand().args).toContain('-E')

      done()
    })

    it('add -J to command line when kanji is set to jis.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'mendex', kanji: 'jis' })

      expect(rule.constructCommand().args).toContain('-J')

      done()
    })

    it('add -S to command line when kanji is set to sjis.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'mendex', kanji: 'sjis' })

      expect(rule.constructCommand().args).toContain('-S')

      done()
    })

    it('add -U to command line when kanji is set to utf8.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'mendex', kanji: 'utf8' })

      expect(rule.constructCommand().args).toContain('-U')

      done()
    })

    it('add -I to command line when kanjiInternal set.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'mendex', kanjiInternal: 'euc' })

      expect(rule.constructCommand().args).toEqual(jasmine.arrayContaining(['-I', 'euc']))

      done()
    })

    it('add -d to command line when indexDictionary is set.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'mendex', indexDictionary: 'foo' })

      expect(rule.constructCommand().args).toEqual(jasmine.arrayContaining(['-d', 'foo']))

      done()
    })

    it('add -f to command line when indexForceKanji is set.', async (done) => {
      await initialize(['IndexControlFile.idx', 'LaTeX.log-ParsedLaTeXLog'], { indexEngine: 'mendex', indexForceKanji: true })

      expect(rule.constructCommand().args).toContain('-f')

      done()
    })
  })
})
