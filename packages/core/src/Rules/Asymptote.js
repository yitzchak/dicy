/* @flow */

import File from '../File'
import Rule from '../Rule'

import type { Action, CommandOptions } from '../types'

export default class Asymptote extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['Asymptote'])]
  static description: string = 'Run Asymptote on any generated .asy files.'

  async initialize (): Promise<void> {
    // Add the parsed log as an input for updateDependencies
    await this.getResolvedInput('$DIR/$NAME.log-ParsedAsymptoteLog', this.firstParameter)
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    // ParsedAsymptoteLog triggers updateDependencies, all others trigger run.
    return [file.type === 'ParsedAsymptoteLog' ? 'updateDependencies' : 'run']
  }

  constructCommand (): CommandOptions {
    // We are executing in the same directory as the source file so we only need
    // the base name. Also, execute with high verbosity so we can capture a log
    // file from the output.
    return {
      args: ['asy', '-vv', this.resolvePath('$BASE', this.firstParameter)],
      severity: 'error'
    }
  }

  constructProcessOptions (): Object {
    return Object.assign(super.constructProcessOptions(), {
      maxBuffer: 524288,
      cwd: this.resolvePath('$ROOTDIR/$DIR', this.firstParameter)
    })
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    const output = await this.getResolvedOutput('$DIR/$NAME.log-AsymptoteLog', this.firstParameter)

    if (output) output.value = `${stdout}\n${stderr}`

    /* eslint no-template-curly-in-string: 0 */
    await this.getResolvedOutputs([
      '$DIR/${NAME}_0.pdf',
      '$DIR/${NAME}_0.eps',
      '$DIR/$NAME.pre'
    ], this.firstParameter)

    return true
  }
}
