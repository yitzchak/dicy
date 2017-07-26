/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type { Action, Command, CommandOptions, ParsedLog, Phase } from '../types'

export default class SplitIndex extends Rule {
  static parameterTypes: Array<Set<string>> = [
    new Set(['IndexControlFile']),
    new Set(['ParsedLaTeXLog'])
  ]
  static description: string = 'Runs splitindex on any index files.'

  static async appliesToParameters (state: State, command: Command, phase: Phase, jobName: ?string, ...parameters: Array<File>): Promise<boolean> {
    const base = path.basename(parameters[0].filePath)
    const text = `Using splitted index at ${base}`
    const alt = 'Remember to run (pdf)latex again after calling `splitindex\''
    const wasGeneratedBySplitIndex = state.isOutputOf(parameters[0], 'SplitIndex')
    const commandPattern: RegExp = new RegExp(`^splitindex\\b.*?\\b${base}$`)
    const parsedLog: ?ParsedLog = parameters[1].value

    // Only apply to index control files when there is some indication from the
    // log that we need to.
    return !!parsedLog && !wasGeneratedBySplitIndex &&
      (parsedLog.messages.findIndex(message => message.text === text || message.text.startsWith(alt)) !== -1 ||
      parsedLog.calls.findIndex(call => commandPattern.test(call.command)) !== -1)
  }

  async getFileActions (file: File): Promise<Array<Action>> {
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

    const parsedLog: ?ParsedLog = this.secondParameter.value
    const { base } = path.parse(this.firstParameter.filePath)
    const commandPattern: RegExp = new RegExp(`^splitindex\\b.*?\\b${base}$`)
    const isCall = call => commandPattern.test(call.command) && call.status.startsWith('executed')

    // If the correct makeindex call is found in the log then delete the run
    // action.
    if (parsedLog && parsedLog.calls.findIndex(isCall) !== -1) {
      this.info('Skipping splitindex call since splitindex was already executed via shell escape.', this.id)
      const makeIndexPattern: RegExp = /^makeindex\b.*?\b(.*)$/

      for (const call of parsedLog.calls) {
        const match = call.command.match(makeIndexPattern)
        if (match) {
          await this.getOutput(match[1].trim())
        }
      }

      this.actions.delete('run')
    }
  }

  constructCommand (): CommandOptions {
    // Be extra verbose and capture all output for parsing
    return {
      args: ['splitindex', '-v', '-v', '-m', '', '$DIR_0/$BASE_0'],
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: ['$DIR_0/$NAME_0.log-ParsedSplitIndexStdOut'],
      stdout: '$DIR_0/$NAME_0.log-SplitIndexStdOut',
      stderr: '$DIR_0/$NAME_0.log-SplitIndexStdErr'
    }
  }
}
