import Rule from '../Rule'
import { RuleDescription } from '../types'

export default class AssignJobNames extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['load'],
    phases: ['finalize']
  }]
  static alwaysEvaluate: boolean = true

  async run (): Promise<boolean> {
    // Get the source file associated with this job and also make sure there
    // is a Nil file.
    const files = await this.getFiles([this.options.filePath, 'x.y-Nil'])

    if (this.options.jobName) {
      // If we have a job name then add it.
      for (const file of files) {
        file.jobNames.add(this.options.jobName)
      }
    }

    return true
  }
}
