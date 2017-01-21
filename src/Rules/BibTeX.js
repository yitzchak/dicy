/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'

import Rule from '../Rule'
import File from '../File'

export default class BibTeX extends Rule {
  static fileTypes: Set<string> = new Set(['ParsedLaTeXLog'])

  input: ?File

  async evaluate () {
    if (!this.input && !!this.firstParameter.value && !!this.firstParameter.value.messages && !!this.firstParameter.value.messages.some(message => message.text.match(/(BibTeX|natbib)/))) {
      this.input = await this.getInput(this.resolveOutputPath('.aux'))
    }

    if (!this.input) return true

    const triggers = Array.from(this.getTriggers())
    const run: boolean = triggers.length === 0 ||
      triggers.some(file => file.type !== 'ParsedLaTeXLog' || (file.value && file.value.messages && file.value.messages.some(message => message.text.match(/run BibTeX/))))

    if (!run) return true

    this.info(`Running ${this.id}...`)

    try {
      const args = await this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `bibtex ${args.join(' ')}`

      const stdout = await childProcess.exec(command, options)
      await this.addResolvedOutputs(['.bbl', '.blg'])
      await this.parseOutput(stdout)
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

    if (this.options.outputDirectory) {
      options.env = Object.assign({}, process.env, { BIBINPUTS: `.:${this.options.outputDirectory}` })
    }

    return options
  }

  async constructArguments () {
    const args = []

    if (this.input) args.push(`"${this.input.normalizedFilePath}"`)

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
