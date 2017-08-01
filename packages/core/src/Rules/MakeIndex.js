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
    if (!this.options.MakeIndex_style) {
      switch (this.firstParameter.type) {
        case 'NomenclatureControlFile':
          this.options.MakeIndex_style = 'nomencl.ist'
          break
        case 'BibRefControlFile':
          this.options.MakeIndex_style = 'bibref.ist'
          break
      }
    }

    // Automatically assign output path based on index type.
    if (!this.options.MakeIndex_outputPath) {
      switch (this.firstParameter.type) {
        case 'NomenclatureControlFile':
          this.options.MakeIndex_outputPath = '$DIR_0/$NAME_0.nls'
          break
        case 'BibRefControlFile':
          this.options.MakeIndex_outputPath = '$DIR_0/$NAME_0.bnd'
          break
        default:
          this.options.MakeIndex_outputPath = `$DIR_0/$NAME_0.${firstChar}nd`
          break
      }
    }

    // Automatically assign log path based on index type.
    if (!this.options.MakeIndex_logPath) {
      // .brlg instead of .blg is used as extension to avoid ovewriting any
      // Biber/BibTeX logs.
      this.options.MakeIndex_logPath = `$DIR_0/$NAME_0.${firstChar === 'b' ? 'br' : firstChar}lg`
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
        this.options.MakeIndex_compressBlanks = !!call.options.c
        this.options.MakeIndex_automaticRanges = !call.options.r
        this.options.MakeIndex_ordering = call.options.l ? 'letter' : 'word'
        if ('p' in call.options) {
          this.options.MakeIndex_startPage = call.options.p
        }
        if ('s' in call.options) {
          this.options.MakeIndex_style = call.options.s
        }
        if (call.options.g) {
          this.options.MakeIndex_sorting = 'german'
        } else if (call.options.T) {
          this.options.MakeIndex_sorting = 'thai'
        } else if (call.options.L) {
          this.options.MakeIndex_sorting = 'locale'
        } else {
          this.options.MakeIndex_sorting = 'default'
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
    const style = this.options.MakeIndex_style
    const logPath = this.options.MakeIndex_logPath
    const outputPath = this.options.MakeIndex_outputPath

    if (engine !== 'makeindex' && !!style) {
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
    if (this.options.MakeIndex_compressBlanks) {
      if (args[0] === 'makeindex') {
        args.push('-c')
      } else {
        this.info('Ignoring compressBlanks setting since index engine is not makeindex.', this.id)
      }
    }

    // Ignore spaces in grouping.
    if (this.options.MakeIndex_ordering === 'letter') {
      args.push('-l')
    }

    // It is possible to have all of these enabled at the same time, but
    // inspection of the makeindex code seems to indicate that `thai` implies
    // `locale` and that `locale` prevents `german` from being used.
    switch (this.options.MakeIndex_sorting) {
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

    // Specify the starting page.
    if (this.options.MakeIndex_startPage) {
      if (args[0] === 'makeindex') {
        args.push('-p', this.options.MakeIndex_startPage)
      } else {
        this.info('Ignoring startPage setting since index engine is not makeindex.', this.id)
      }
    }

    // Prevent automatic range construction.
    if (!this.options.MakeIndex_automaticRanges) {
      args.push('-r')
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
