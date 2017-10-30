import * as path from 'path'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import {
  Action,
  Command,
  CommandOptions,
  IndexEngine,
  OptionsInterface,
  ParsedLog,
  Phase
} from '../types'

export default class MakeIndex extends Rule {
  static parameterTypes: Set<string>[] = [
    new Set([
      'IndexControlFile',
      'BibRefControlFile',
      'NomenclatureControlFile'
    ]),
    new Set(['ParsedLaTeXLog'])
  ]
  static description: string = 'Runs makeindex on any index files.'

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: File[] = []): Promise<boolean> {
    const parsedLog: ParsedLog | undefined = parameters[1].value
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
    const parsedLog: ParsedLog | undefined = this.secondParameter.value

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
      let call = Log.findCall(parsedLog, /^(makeindex|texindy|mendex|upmendex)$/, base)

      if (!call) {
        call = Log.findMessageMatches(parsedLog, /after calling `((?:makeindex|texindy|mendex|upmendex)[^']*)'/)
          .map(match => Log.parseCall(match[1], 'gronk'))
          .find(call => call.args.includes(base))
      }

      if (call) {
        switch (call.args[0]) {
          case 'makeindex':
          case 'texindy':
          case 'mendex':
          case 'upmendex':
            this.options.indexEngine = call.args[0] as IndexEngine
            break
          default:
            this.info(`Ignoring unknown index engine \`${call.args[0]}\``)
        }
        this.options.indexCompressBlanks = !!call.options.c
        this.options.indexAutomaticRanges = !call.options.r
        this.options.indexOrdering = call.options.l ? 'letter' : 'word'
        if ('t' in call.options) {
          this.options.indexLogPath = call.options.t.toString()
        }
        if ('o' in call.options) {
          this.options.indexOutputPath = call.options.o.toString()
        }
        if ('p' in call.options) {
          this.options.indexStartPage = call.options.p.toString()
        }
        if ('s' in call.options) {
          this.options.indexStyle = call.options.s.toString()
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
              this.options.kanjiInternal = call.options.I.toString() as 'euc' | 'sjis' | 'uptex' | 'utf8'
            }
            // falls through
          case 'upmendex':
            if (call.options.d) {
              this.options.indexDictionary = call.options.d.toString()
            }

            if (call.options.f) {
              this.options.indexForceKanji = true
            }

            break
        }
      }
    }
  }

  async getFileActions (file: File): Promise<Action[]> {
    // Only return a run action for the actual idx file and updateDependencies
    // for the parsed makeindex log.
    switch (file.type) {
      case 'ParsedMakeIndexLog':
      case 'ParsedMendexLog':
      case 'ParsedXindyLog':
        return ['updateDependencies']
      case 'ParsedLaTeXLog':
        return []
      default:
        return ['run']
    }
  }

  async preEvaluate (): Promise<void> {
    if (!this.actions.has('run')) return

    const parsedLog: ParsedLog | undefined = this.secondParameter.value
    const { base, ext } = path.parse(this.firstParameter.filePath)
    const engine = this.options.indexEngine

    // If the correct makeindex call is found in the log then delete the run
    // action.
    if (parsedLog) {
      const call = Log.findCall(parsedLog, engine, base, 'executed')
      if (call) {
        this.info(`Skipping ${engine} call since ${engine} was already executed via shell escape.`)
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
    const texindy = this.options.indexEngine === 'texindy'
    const mendex = this.options.indexEngine === 'mendex'
    const upmendex = this.options.indexEngine === 'upmendex'
    const makeindex = this.options.indexEngine === 'makeindex'
    const logPath = this.options.indexLogPath || '$DIR_0/$NAME_0.ilg'
    const outputPath = this.options.indexOutputPath || '$DIR_0/$NAME_0.ind'
    const parsedLogName = texindy
      ? 'ParsedXindyLog'
      : (makeindex ? 'ParsedMakeIndexLog' : 'ParsedMendexLog')
    const infoIgnoreSetting = (name: string) => {
      this.info(`Ignoring \`${name}\` setting of \`${this.options[name].toString()}\` since index engine \`${this.options.engine}\` does not support that option or setting.`)
    }

    const args = [
      this.options.indexEngine,
      '-t', `{{${logPath}}}`,
      '-o', `{{${outputPath}}}`
    ]

    if (this.options.indexStyle) {
      if (texindy) {
        infoIgnoreSetting('indexStyle')
      } else {
        args.push('-s', this.options.indexStyle)
      }
    }

    // Remove blanks from index ids
    if (this.options.indexCompressBlanks) {
      if (texindy) {
        infoIgnoreSetting('indexCompressBlanks')
      } else {
        args.push('-c')
      }
    }

    // Ignore spaces in grouping.
    if (this.options.indexOrdering === 'letter') {
      args.push('-l')
    }

    if (this.options.indexSorting !== 'default') {
      // It is possible to have all of these enabled at the same time, but
      // inspection of the makeindex code seems to indicate that `thai` implies
      // `locale` and that `locale` prevents `german` from being used.
      if (makeindex) {
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
      } else if (texindy && this.options.indexSorting === 'german') {
        args.push('-g')
      } else {
        infoIgnoreSetting('indexSorting')
      }
    }

    // Specify the starting page.
    if (this.options.indexStartPage) {
      if (texindy) {
        infoIgnoreSetting('indexStartPage')
      } else {
        args.push('-p', this.options.indexStartPage)
      }
    }

    // Prevent automatic range construction.
    if (!this.options.indexAutomaticRanges) {
      args.push('-r')
    }

    if (this.options.kanji) {
      if (mendex) {
        // mendex doesn't have all of the encodings in the kanji or the
        // kanjiInternal setting, but we at least try here.
        switch (this.options.kanji) {
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
            infoIgnoreSetting('kanji')
            break
        }
      } else {
        infoIgnoreSetting('kanji')
      }
    }

    if (this.options.kanjiInternal) {
      if (mendex && (this.options.kanjiInternal === 'euc' || this.options.kanjiInternal === 'utf8')) {
        args.push('-I', this.options.kanjiInternal)
      } else {
        infoIgnoreSetting('kanjiInternal')
      }
    }

    if (this.options.indexForceKanji) {
      // Both mendex and upmendex allow forcing kanji.
      if (mendex || upmendex) {
        args.push('-f')
      } else {
        infoIgnoreSetting('indexForceKanji')
      }
    }

    if (this.options.indexDictionary) {
      // Both mendex and upmendex have a sorting based on pronounciation.
      if (mendex || upmendex) {
        args.push('-d', `{{${this.options.indexDictionary}}}`)
      } else {
        infoIgnoreSetting('indexDictionary')
      }
    }

    args.push('{{$FILEPATH_0}}')

    const commandOptions: CommandOptions = {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: [`${logPath}-${parsedLogName}`],
      outputs: [outputPath, logPath]
    }

    if (mendex || upmendex) {
      commandOptions.stderr = '$DIR_0/$NAME_0.log-MendexStdErr'
    }

    return commandOptions
  }
}
