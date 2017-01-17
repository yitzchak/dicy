/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'

import Rule from '../Rule'

export default class BibTeX extends Rule {
  static fileTypes: Set<string> = new Set(['BibTeXControlFile'])
  static priority: number = 100

  async evaluate () {
    await this.getInput(this.resolveOutputPath('.log'))

    const triggers = Array.from(this.getTriggers())
    const run: boolean = triggers.length === 0 || triggers.some(file => file.type !== 'LaTeXLog' || file.contents.messages.some(message => message.text.match(/run BibTeX/)))

    if (!run) return

    console.log('Running BibTeX...')

    try {
      const args = await this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `bibtex ${args.join(' ')}`

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

    if (this.options.outputDirectory) {
      options.env = Object.assign({}, process.env, { BIBINPUTS: `.:${this.options.outputDirectory}` })
    }

    return options
  }

  async constructArguments () {
    const args = []
    const auxFile = await this.getInput(this.resolveOutputPath('.aux'))

    if (auxFile) args.push(`"${auxFile.normalizedFilePath}"`)

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
