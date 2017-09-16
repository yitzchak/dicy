/* @flow */

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import type { Command, Phase, OptionsInterface } from '../types'

export default class CheckForMissingBuildRule extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['*'])]
  static phases: Set<Phase> = new Set(['finalize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Check for no applicable build rule.'

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: Array<File> = []): Promise<boolean> {
    // Only apply if parameter is main source file for job.
    return parameters.some(file => file.filePath === options.filePath)
  }

  async run (): Promise<boolean> {
    const rules = Array.from(this.rules)

    // If targets found for this job then just return true.
    if (rules.some(rule => rule.command === 'build' && rule.phase === 'execute' && rule.parameters.includes(this.firstParameter))) return true
    const jobName = this.options.jobName

    // No rules found so log an error message and cause rule failure.
    const jobText = jobName ? ` with job name of \`${jobName}\`` : ''
    this.error(`No applicable build rule was found for main source file \`${this.firstParameter.filePath}\`${jobText}.`)

    return false
  }
}
