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
    const commandPattern: RegExp = new RegExp(`^splitindex\\b.*?\\b${base}$`)
    const parsedLog: ?ParsedLog = parameters[1].value

    return !!parsedLog &&
      (parsedLog.messages.findIndex(message => message.text === text) !== -1 ||
      parsedLog.calls.findIndex(call => commandPattern.test(call.command)) !== -1)
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    switch (file.type) {
      case 'ParsedSplitIndexStdOut':
        return ['updateDependencies']
      case 'ParsedLaTeXLog':
        return []
      default:
        return ['run']
    }
  }

  constructCommand (): CommandOptions {
    return {
      args: ['splitindex', '-v', '-m', ' ', '$DIR_0/$BASE_0'],
      cd: '$ROOTDIR',
      severity: 'error',
      inputs: ['$DIR_0/$NAME_0.log-ParsedSplitIndexStdOut'],
      stdout: '$DIR_0/$NAME_0.log-SplitIndexStdOut',
      stderr: '$DIR_0/$NAME_0.log-SplitIndexStdErr'
    }
  }
}
