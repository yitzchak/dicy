import { Command, Phase } from '../types'
import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'

export default class CheckForMissingBuildRule extends Rule {
  static parameterTypes: Set<string>[] = [new Set<string>(['*'])]
  static phases: Set<Phase> = new Set<Phase>(['finalize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Check for no applicable build rule.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    // Only apply if parameter is main source file for job.
    return parameters.some(file => file.filePath === consumer.options.filePath)
  }

  async run (): Promise<boolean> {
    const rules: Rule[] = Array.from(this.rules)

    // If targets found for this job then just return true.
    if (rules.some((rule: Rule) => rule.command === 'build' && rule.phase === 'execute' && rule.parameters.includes(this.firstParameter))) return true
    const jobName = this.options.jobName

    // No rules found so log an error message and cause rule failure.
    const jobText = jobName ? ` with job name of \`${jobName}\`` : ''
    this.error(`No applicable build rule was found for main source file \`${this.firstParameter.filePath}\`${jobText}.`)

    return false
  }
}
