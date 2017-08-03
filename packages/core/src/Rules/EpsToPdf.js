/* @flow */

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, Phase, CommandOptions, ParsedLog } from '../types'

export default class EpsToPdf extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set(['EncapsulatedPostScript']),
    new Set(['ParsedLaTeXLog'])
  ]
  static description: string = 'Converts EPS to PDF using epstopdf.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    return !!EpsToPdf.findCall(parameters[1].value, parameters[0].filePath)
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

    console.log(call)

    return call
  }

  async initialize () {
    const call = EpsToPdf.findCall(this.parameters[1].value, this.parameters[0].filePath)

    if (call) {
      if (call.options.outfile) {
        this.options.EpsToPdf_outputPath = call.options.outfile
      } else if (call.args.length > 2) {
        this.options.EpsToPdf_outputPath = call.args[2]
      }
    }
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    // Only return a run action for the actual eps file.
    switch (file.type) {
      case 'ParsedLaTeXLog':
        return []
      default:
        return ['run']
    }
  }

  async preEvaluate () {
    const call = EpsToPdf.findCall(this.parameters[1].value, this.parameters[0].filePath)

    if (call && call.status.startsWith('executed')) {
      this.info(`Skipping epstopdf call since epstopdf was already executed via shell escape.`, this.id)

      await this.getResolvedOutput(this.options.EpsToPdf_outputPath)

      this.actions.delete('run')
    }
  }

  constructCommand (): CommandOptions {
    return {
      args: [
        'epstopdf',
        '$DIR_0/$BASE_0',
        this.options.EpsToPdf_outputPath
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [this.options.EpsToPdf_outputPath]
    }
  }
}
