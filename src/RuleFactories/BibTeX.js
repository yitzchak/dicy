/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class BibTeX extends Rule {
  constructor (buildState: BuildState, jobName: ?string, ...parameters: Array<File>) {
    super(buildState, jobName, ...parameters)
    this.priority = 100
  }

  async evaluate () {
    await this.getInput(this.resolveOutputPath('.log'))

    const triggers = Array.from(this.getTriggers())
    const run: boolean = triggers.length === 0 || triggers.some(file => file.type !== 'LaTeXLog' || file.contents.messages.some(message => message.text.match(/run BibTeX/)))

    if (!run) return

    console.log('Running BibTeX...')

    try {
      const args = this.constructArguments()
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

export default class BibTeXFactory extends RuleFactory {
  async analyze (file: File, jobName: ?string) {
    if (file.type === 'BibTeXControlFile') {
      const auxPath = this.buildState.resolveOutputPath('.aux', jobName)
      const auxFile = await this.buildState.getFile(auxPath)
      if (auxFile) {
        const rule = new BibTeX(this.buildState, jobName, auxFile)
        await this.buildState.addRule(rule)
      }
    }
  }
}
