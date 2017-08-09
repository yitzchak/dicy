/* @flow */

import path from 'path'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, Phase, CommandOptions, ParsedLog } from '../types'

export default class EpsToPdf extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set(['EncapsulatedPostScript']),
    new Set(['ParsedLaTeXLog', 'Nil'])
  ]
  static description: string = 'Converts EPS to PDF using epstopdf.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    switch (parameters[1].type) {
      case 'Nil':
        const filePath = state.getOption('filePath', jobName)
        return !!filePath && parameters[0].filePath === path.normalize(filePath)
      case 'ParsedLaTeXLog':
        return !!EpsToPdf.findCall(parameters[1].value, parameters[0].filePath)
      default:
        return false
    }
  }

  static findCall (parsedLog: ?ParsedLog, filePath: string) {
    let call

    if (parsedLog) {
      call = Log.findCall(parsedLog, /^r?epstopdf$/, filePath)

      if (!call) {
        call = Log.findMessageMatches(parsedLog, /Command: <([^>]*)>/, 'Package epstopdf')
          .map(match => Log.parseCall(match[1]))
          .find(call => call.args.includes(filePath))
      }
    }

    return call
  }

  async initialize () {
    const call = EpsToPdf.findCall(this.parameters[1].value, this.parameters[0].filePath)

    if (call) {
      if (call.options.outfile) {
        this.options.epstopdfOutputPath = call.options.outfile
      } else if (call.args.length > 2) {
        this.options.epstopdfOutputPath = call.args[2]
      }

      this.options.epstopdfBoundingBox = call.options.exact
        ? 'exact'
        : (call.options.hires ? 'hires' : 'default')
    }
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    // Only return a run action for the actual eps file.
    return file.type === 'EncapsulatedPostScript' ? ['run'] : []
  }

  async preEvaluate () {
    const call = EpsToPdf.findCall(this.parameters[1].value, this.parameters[0].filePath)

    if (call && call.status.startsWith('executed')) {
      this.info(`Skipping epstopdf call since epstopdf was already executed via shell escape.`, this.id)

      await this.getResolvedOutput(this.options.epstopdfOutputPath)

      this.actions.delete('run')
    }
  }

  constructCommand (): CommandOptions {
    const outputPath = this.resolvePath(this.options.epstopdfOutputPath)
    const args = [
      'epstopdf',
      `--outfile=${outputPath}`,
      '$DIR_0/$BASE_0'
    ]

    switch (this.options.epstopdfBoundingBox) {
      case 'exact':
        args.push('--exact')
        break
      case 'hires':
        args.push('--hires')
        break
    }

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [outputPath]
    }
  }
}
