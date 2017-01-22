/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'

import Rule from '../Rule'

export default class MakeIndex extends Rule {
  static fileTypes: Set<string> = new Set(['IndexControlFile'])

  async evaluate (): Promise<boolean> {
    // const triggers = Array.from(this.getTriggers())
    // const run: boolean = triggers.length === 0 ||
    //   triggers.some(file => file.type !== 'ParsedLaTeXLog' || (file.value && file.value.messages && file.value.messages.some(message => message.text.match(/run Biber/))))
    //
    // if (!run) return true

    this.info(`Running ${this.id}...`)

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `makeindex ${args.join(' ')}`

      const stdout = await childProcess.exec(command, options)
      await this.addResolvedInputs(['.ilg-ParsedMakeIndexLog'])
      await this.addResolvedOutputs(['.ind', '.ilg'])
      // await this.parseOutput(stdout)
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
