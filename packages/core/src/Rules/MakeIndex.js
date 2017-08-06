/* @flow */

import path from 'path'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, ParsedLog, Phase } from '../types'

export default class MakeIndex extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set([
      'IndexControlFile',
      'BibRefControlFile',
      'NomenclatureControlFile'
    ]),
    new Set(['ParsedLaTeXLog'])
  ]
  static description: string = 'Runs makeindex on any index files.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    const parsedLog: ?ParsedLog = parameters[1].value
    const base = path.basename(parameters[0].filePath)
    const messagePattern = new RegExp(`(Using splitted index at ${base}|Remember to run \\(pdf\\)latex again after calling \`splitindex')`)
    const wasGeneratedBySplitIndex = state.isOutputOf(parameters[0], 'SplitIndex')
    const splitindexCall = !!parsedLog && !!Log.findCall(parsedLog, 'splitindex', base)
    const splitindexMessage = !!parsedLog && !!Log.findMessage(parsedLog, messagePattern)

    // Avoid makeindex if there is any evidence of splitindex messages in the
    // log or splitindex calls unless this index control file was generated
    // by splitindex.
    return wasGeneratedBySplitIndex || (!splitindexMessage && !splitindexCall)
  }

  async initialize () {
    const ext = path.extname(this.firstParameter.filePath)
    const firstChar = ext[1]
    const parsedLog: ?ParsedLog = this.secondParameter.value

    // Automatically assign style based on index type.
    if (!this.options.indexStyle) {
      switch (this.firstParameter.type) {
        case 'NomenclatureControlFile':
          this.options.indexStyle = 'nomencl.ist'
          break
        case 'BibRefControlFile':
          this.options.indexStyle = 'bibref.ist'
          break
      }
    }

    // Automatically assign output path based on index type.
    if (!this.options.indexOutputPath) {
      switch (this.firstParameter.type) {
        case 'NomenclatureControlFile':
          this.options.indexOutputPath = '$DIR_0/$NAME_0.nls'
          break
        case 'BibRefControlFile':
          this.options.indexOutputPath = '$DIR_0/$NAME_0.bnd'
          break
        default:
          this.options.indexOutputPath = `$DIR_0/$NAME_0.${firstChar}nd`
          break
      }
    }

    // Automatically assign log path based on index type.
    if (!this.options.indexLogPath) {
      // .brlg instead of .blg is used as extension to avoid ovewriting any
      // Biber/BibTeX logs.
      this.options.indexLogPath = `$DIR_0/$NAME_0.${firstChar === 'b' ? 'br' : firstChar}lg`
    }

    if (parsedLog) {
      const { base } = path.parse(this.firstParameter.filePath)
      let call = Log.findCall(parsedLog, /(makeindex|texindy)/, base)

      if (!call) {
        call = Log.findMessageMatches(parsedLog, /after calling `((?:makeindex|texindy)[^']*)'/)
          .map(match => Log.parseCall(match[1], 'gronk'))
          .find(call => call.args.includes(base))
      }

      if (call) {
        this.options.indexEngine = call.args[0]
        this.options.indexCompressBlanks = !!call.options.c
        this.options.indexAutomaticRanges = !call.options.r
        this.options.indexOrdering = call.options.l ? 'letter' : 'word'
        if ('p' in call.options) {
          this.options.indexStartPage = call.options.p
        }
        if ('s' in call.options) {
          this.options.indexStyle = call.options.s
        }
        switch (call.args[0]) {
          case 'makeindex':
            if (call.options.g) {
              this.options.indexSorting = 'german'
            } else if (call.options.T) {
              this.options.indexSorting = 'thai'
            } else if (call.options.L) {
              this.options.indexSorting = 'locale'
            } else {
              this.options.indexSorting = 'default'
            }
            break
          case 'mendex':
            if (call.options.E) {
              this.options.kanji = 'euc'
            } else if (call.options.J) {
              this.options.kanji = 'jis'
            } else if (call.options.S) {
              this.options.kanji = 'sjis'
            } else if (call.options.U) {
              this.options.kanji = 'utf8'
            }

            if (call.options.I) {
              this.options.kanjiInternal = call.options.kanjiInternal
            }

            if (call.options.d) {
              this.options.indexDictionary = this.options.d
            }

            if (call.options.f) {
              this.options.indexForceKanji = true
            }

            break
        }
      }
    }
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    // Only return a run action for the actual idx file and updateDependencies
    // for the parsed makeindex log.
    switch (file.type) {
      case 'ParsedMakeIndexLog':
        return ['updateDependencies']
      case 'ParsedLaTeXLog':
        return []
      default:
        return ['run']
    }
  }

  async preEvaluate (): Promise<void> {
    if (!this.actions.has('run')) return

    const parsedLog: ?ParsedLog = this.secondParameter.value
    const { base, ext } = path.parse(this.firstParameter.filePath)
    const engine = this.options.indexEngine

    // If the correct makeindex call is found in the log then delete the run
    // action.
    if (parsedLog) {
      const call = Log.findCall(parsedLog, engine, base, 'executed')
      if (call) {
        this.info(`Skipping ${engine} call since ${engine} was already executed via shell escape.`, this.id)
        const firstChar = ext[1]

        await this.getResolvedOutputs([
          call.options.t ? `$DIR_0/${call.options.t}` : `$DIR_0/$NAME_0.${firstChar}lg`,
          call.options.o ? `$DIR_0/${call.options.o}` : `$DIR_0/$NAME_0.${firstChar}nd`
        ])

        this.actions.delete('run')
      }
    }
  }

  constructCommand (): CommandOptions {
    let engine = this.options.indexEngine
    const style = this.options.indexStyle
    const logPath = this.options.indexLogPath
    const outputPath = this.options.indexOutputPath

    if (engine === 'texindy' && !!style) {
      engine = 'makeindex'
      this.info(`Ignoring index engine setting of \`${engine}\` since there is a makeindex style set.`, this.id)
    }

    const args = [
      engine,
      '-t', logPath,
      '-o', outputPath
    ]

    if (style) {
      args.push('-s', style)
    }

    // Remove blanks from index ids
    if (this.options.indexCompressBlanks) {
      if (args[0] === 'texindy') {
        this.info('Ignoring compressBlanks setting since index engine is texindy.', this.id)
      } else {
        args.push('-c')
      }
    }

    // Ignore spaces in grouping.
    if (this.options.indexOrdering === 'letter') {
      args.push('-l')
    }

    // It is possible to have all of these enabled at the same time, but
    // inspection of the makeindex code seems to indicate that `thai` implies
    // `locale` and that `locale` prevents `german` from being used.
    if (engine === 'mendex') {
      this.info('Ignoring sorting setting since index engine is mendex.', this.id)
    } else {
      switch (this.options.indexSorting) {
        case 'german':
          args.push('-g')
          break
        case 'thai':
          args.push('-T')
          break
        case 'locale':
          args.push('-L')
          break
      }
    }

    // Specify the starting page.
    if (this.options.indexStartPage) {
      if (args[0] === 'texindy') {
        this.info('Ignoring startPage setting since index engine is texindy.', this.id)
      } else {
        args.push('-p', this.options.indexStartPage)
      }
    }

    // Prevent automatic range construction.
    if (!this.options.indexAutomaticRanges) {
      args.push('-r')
    }

    if (engine === 'mendex') {
      if (this.options.indexForceKanji) {
        args.push('-f')
      }

      if (this.options.indexDictionary) {
        args.push('-d', this.options.indexDictionary)
      }

      switch (this.options.kanji) {
        case undefined:
          break
        case 'euc':
          args.push('-E')
          break
        case 'jis':
          args.push('-J')
          break
        case 'sjis':
          args.push('-S')
          break
        case 'utf8':
          args.push('-U')
          break
        default:
          this.info(`Ignoring kanji setting of ${this.options.kanji} since mendex does not have that encoding.`, this.id)
          break
      }

      switch (this.options.kanjiInternal) {
        case undefined:
          break
        case 'euc':
        case 'utf8':
          args.push('-I', this.options.kanjiInternal)
          break
        default:
          this.info(`Ignoring kanjiInternal setting of ${this.options.kanjiInternal} since mendex does not have that encoding.`, this.id)
          break
      }
    }

    args.push('$DIR_0/$BASE_0')

    const parsedLogName = engine === 'makeindex' ? 'ParsedMakeIndexLog' : 'ParsedXindyLog'

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: [`${logPath}-${parsedLogName}`],
      outputs: [outputPath, logPath]
    }
  }
}
