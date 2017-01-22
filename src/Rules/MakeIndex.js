/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'

import Rule from '../Rule'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile'])

  async evaluate (): Promise<boolean> {
    this.info(`Running ${this.id}...`)

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `makeindex ${args.join(' ')}`

      await childProcess.exec(command, options)
      await this.addResolvedInputs(['.ilg-ParsedMakeIndexLog'])
      await this.addResolvedOutputs(['.ind', '.ilg'])
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

  constructArguments () {
    const args = []

    args.push(`"${this.firstParameter.normalizedFilePath}"`)

    return args
  }

  async parseOutput (stdout: string) {
    const databasePattern = /^Database file #\d+: (.*)$/mg
    let match

    while ((match = databasePattern.exec(stdout)) !== null) {
      await this.getInput(path.resolve(this.rootPath, match[1]))
      if (this.options.outputDirectory) {
        await this.getInput(path.resolve(this.rootPath, this.options.outputDirectory, match[1]))
      }
    }
  }
}
