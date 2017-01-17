/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'

import Rule from '../Rule'

export default class Biber extends Rule {
  static fileTypes: Set<string> = new Set(['BiberControlFile'])
  static priority: number = 100

  async evaluate () {
    await this.getInput(this.resolveOutputPath('.log'))

    const triggers = Array.from(this.getTriggers())
    const run: boolean = triggers.length === 0 || triggers.some(file => file.type !== 'LaTeXLog' || file.contents.messages.some(message => message.text.match(/run Biber/)))

    if (!run) return

    console.log('Running Biber...')

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `biber ${args.join(' ')}`

      const stdout = await childProcess.exec(command, options)
      await this.addResolvedOutputs(['.bbl', '.blg'])
      await this.parseOutput(stdout)
    } catch (error) {
      console.log(error)
    }
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
