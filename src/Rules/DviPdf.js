/* @flow */

import childProcess from 'mz/child_process'

import BuildState from '../BuildState'
import Rule from '../Rule'

export default class DviPdf extends Rule {
  static fileTypes: Set<string> = new Set(['DVI'])

  static async analyzeCheck (buildState: BuildState, jobName: ?string, file: File): Promise<boolean> {
    return buildState.options.outputFormat === 'pdf'
  }

  async evaluate (): Promise<boolean> {
    this.info(`Running ${this.id}...`)

    try {
      const command = this.constructCommand()
      const options = this.constructProcessOptions()

      await childProcess.exec(command, options)
      await this.addResolvedOutputs(['.pdf'])
    } catch (error) {
      this.error(error.toString())
      return false
    }

    return true
  }

  constructProcessOptions () {
    const options: Object = {
      cwd: this.rootPath
    }

    return options
  }

  constructCommand () {
    return `xdvipdfmx -o "${this.resolveOutputPath('.pdf')}" "${this.firstParameter.normalizedFilePath}"`
  }
}
