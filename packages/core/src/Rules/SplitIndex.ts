import * as path from 'path'

import { Command } from '@dicy/types'

import File from '../File'
import Log from '../Log'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Action, CommandOptions, ParsedLog, Phase } from '../types'

export default class SplitIndex extends Rule {
  static parameterTypes: Set<string>[] = [
    new Set(['IndexControlFile']),
    new Set(['ParsedLaTeXLog'])
  ]
  static description: string = 'Runs splitindex on any index files.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    const parsedLog: ParsedLog | undefined = parameters[1].value
    const base = path.basename(parameters[0].filePath)
    const messagePattern = new RegExp(`(Using splitted index at ${base}|Remember to run \\(pdf\\)latex again after calling \`splitindex')`)
    const wasGeneratedBySplitIndex = consumer.isOutputOf(parameters[0], 'SplitIndex')
    const splitindexCall = !!parsedLog && !!Log.findCall(parsedLog, 'splitindex', base)
    const splitindexMessage = !!parsedLog && !!Log.findMessage(parsedLog, messagePattern)

    // Only apply to index control files when there is some indication from the
    // log that we need to.
    return !wasGeneratedBySplitIndex && (splitindexCall || splitindexMessage)
  }

  async getFileActions (file: File): Promise<Action[]> {
    // Only return a run action for the actual idx file and updateDependencies
    // for the parsed splitindex output.
    switch (file.type) {
      case 'ParsedSplitIndexStdOut':
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
    const { base } = path.parse(this.firstParameter.filePath)

    // If the correct makeindex call is found in the log then delete the run
    // action.
    if (parsedLog) {
      const call = Log.findCall(parsedLog, 'splitindex', base, 'executed')
      if (call) {
        this.info('Skipping splitindex call since splitindex was already executed via shell escape.')
        for (const call of Log.filterCalls(parsedLog, 'makeindex')) {
          await this.getOutputs(call.args.slice(1))
        }

        this.actions.delete('run')
      }
    }
  }

  constructCommand (): CommandOptions {
    // Be extra verbose and capture all output for parsing
    return {
      args: ['splitindex', '-v', '-v', '-m', '', '{{$FILEPATH_0}}'],
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: ['$DIR_0/$NAME_0.log-ParsedSplitIndexStdOut'],
      stdout: '$DIR_0/$NAME_0.log-SplitIndexStdOut',
      stderr: '$DIR_0/$NAME_0.log-SplitIndexStdErr'
    }
  }
}
