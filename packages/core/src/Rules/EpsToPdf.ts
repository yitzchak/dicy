import * as path from 'path'

import { Command } from '@dicy/types'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import {
  Action, ShellCall, Phase, CommandOptions, ParsedLog, RuleDescription
} from '../types'

export default class EpsToPdf extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['EncapsulatedPostScript'], ['ParsedLaTeXLog', 'Nil']]
  }]

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    switch (parameters[1].type) {
      case 'Nil':
        // If there is not a LaTeX log present then only apply epstopdf when the
        // main source file is an EPS.
        return parameters[0].filePath === path.normalize(consumer.options.filePath) &&
          consumer.options.outputFormat === 'pdf'
      case 'ParsedLaTeXLog':
        // When there is a LaTeX log present only apply epstopdf if there are
        // specific calls present, usually from the epstopdf package.
        return !!EpsToPdf.findCall(parameters[1].value, parameters[0].filePath)
      default:
        return false
    }
  }

  /**
   * Find an epstopdf call either in the call list or in an epstopdf package
   * message.
   * @param  {ParsedLog}  parsedLog   The parsed LaTeX log.
   * @param  {string}     filePath    The file path to look for.
   * @return {ShellCall}              The shell call found or null if no
   *                                  matching call was found.
   */
  static findCall (parsedLog: ParsedLog | undefined, filePath: string): ShellCall | undefined {
    let call

    if (parsedLog) {
      // First look for shell escape call.
      call = Log.findCall(parsedLog, /^r?epstopdf$/, filePath)

      if (!call) {
        // If there is no shell escape call then look for a message from the
        // epstopdf package.
        call = Log.findMessageMatches(parsedLog, /Command: <([^>]*)>/, 'Package epstopdf')
          .map(match => Log.parseCall(match[1]))
          .find(call => call.args.includes(filePath))
      }
    }

    return call
  }

  async initialize () {
    if (this.secondParameter.type !== 'Nil') {
      const call = EpsToPdf.findCall(this.parameters[1].value, this.parameters[0].filePath)

      if (call) {
        // There is a matching call so scrape the options from it.
        if (call.options.outfile) {
          this.options.epstopdfOutputPath = call.options.outfile.toString()
        } else if (call.args.length > 2) {
          this.options.epstopdfOutputPath = call.args[2]
        }

        this.options.epstopdfBoundingBox = call.options.exact
          ? 'exact'
          : (call.options.hires ? 'hires' : 'default')

        this.options.epstopdfRestricted = !!call.options.restricted
      }
    }
  }

  async getFileActions (file: File): Promise<Action[]> {
    // Only return a run action for the actual eps file.
    return file.type === 'EncapsulatedPostScript' ? ['run'] : []
  }

  async preEvaluate () {
    const call = EpsToPdf.findCall(this.parameters[1].value, this.parameters[0].filePath)

    if (call && call.status.startsWith('executed')) {
      // There is a matching and successful call so just get the resolved output
      // and skip the evaluation.
      this.info(`Skipping epstopdf call since epstopdf was already executed via shell escape.`)

      await this.getResolvedOutput(this.options.epstopdfOutputPath)

      this.actions.delete('run')
    }
  }

  constructCommand (): CommandOptions {
    const outputPath = this.options.epstopdfOutputPath
    // Newer versions of epstopdf support the dvipdfm style "epstopdf in out"
    // but for backward compatability we use `--outfile` instead.
    const command = [
      'epstopdf',
      `--outfile={{${outputPath}}}`
    ]

    // Look for a bounding box setting.
    switch (this.options.epstopdfBoundingBox) {
      case 'exact':
        command.push('--exact')
        break
      case 'hires':
        command.push('--hires')
        break
    }

    // Use restricted if required even though we are executing outside the
    // context of shell escape.
    if (this.options.epstopdfRestricted) {
      command.push('--restricted')
    }

    command.push('{{$FILEPATH_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: [{ file: '$FILEPATH_0', type: 'target' }],
      outputs: [{ file: outputPath, type: 'target' }]
    }
  }
}
