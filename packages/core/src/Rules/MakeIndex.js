/* @flow */

import path from 'path'

import File from '../File'
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
    const base = path.basename(parameters[0].filePath)
    const text = `Using splitted index at ${base}`
    const alt = 'Remember to run (pdf)latex again after calling `splitindex\''
    const wasGeneratedBySplitIndex = state.isOutputOf(parameters[0], 'SplitIndex')
    const parsedLog: ?ParsedLog = parameters[1].value

    // Avoid makeindex if there is any evidence of splitindex messages in the
    // log or splitindex calls unless this index control file was generated
    // by splitindex.
    return !parsedLog || wasGeneratedBySplitIndex ||
      (parsedLog.messages.findIndex(message => message.text === text || message.text.startsWith(alt)) === -1 &&
      parsedLog.calls.findIndex(call => call.args[0] === 'splitindex' && call.args.includes(base)) === -1)
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
    const isCall = call => call.args[0] === engine && call.args.includes(base) && call.status.startsWith('executed')

    // If the correct makeindex call is found in the log then delete the run
    // action.
    if (parsedLog) {
      const call = parsedLog.calls.find(isCall)
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
    const ext = path.extname(this.firstParameter.filePath)
    const firstChar = ext[1]
    // .brlg instead of .blg is used as extension to avoid ovewriting any
    // Biber/BibTeX logs.
    const logPath = `$DIR_0/$NAME_0.${firstChar === 'b' ? 'br' : firstChar}lg`
    let engine = this.options.indexEngine
    let stylePath
    let outputPath

    // Automatically assign output path and style based on index type.
    switch (this.firstParameter.type) {
      case 'NomenclatureControlFile':
        stylePath = 'nomencl.ist'
        outputPath = '$DIR_0/$NAME_0.nls'
        break
      case 'BibRefControlFile':
        stylePath = 'bibref.ist'
        outputPath = '$DIR_0/$NAME_0.bnd'
        break
      default:
        outputPath = `$DIR_0/$NAME_0.${firstChar}nd`
        break
    }

    // Allow the MakeIndex_style option to override the default style selection.
    if (this.options.MakeIndex_style) stylePath = this.options.MakeIndex_style

    if (engine !== 'makeindex' && !!stylePath) {
      engine = 'makeindex'
      this.info(`Ignoring index engine setting of \`${engine}\` since there is a makeindex style set.`, this.id)
    }

    const args = [engine, '-t', logPath, '-o', outputPath]

    if (stylePath) {
      args.push('-s', stylePath)
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
