/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class BibTeX extends Rule {
  constructor (buildState: BuildState, ...parameters: Array<File>) {
    super(buildState, ...parameters)
    this.priority = 100
  }

  async evaluate () {
    await this.getInput(this.buildState.resolveOutputPath('.log'))

    const run: boolean = Array.from(this.getTriggers()).some(file => file.type !== 'LaTeXLog' || file.contents.messages.some(message => message.text.match(/run BibTeX/)))

    if (!run) return

    console.log('Running BibTeX...')

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `bibtex ${args.join(' ')}`

      const stdout = await childProcess.exec(command, options)
      await this.addOutputs([
        this.buildState.resolveOutputPath('.bbl'),
        this.buildState.resolveOutputPath('.blg')
      ])
      await this.parseOutput(stdout)
    } catch (error) {
      console.log(error)
    }
  }

  constructProcessOptions () {
    const options: Object = {
      cwd: this.buildState.dir
    }

    if (this.buildState.options.outputDirectory) {
      options.env = Object.assign({}, process.env, { BIBINPUTS: `.:${this.buildState.options.outputDirectory}` })
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
      await this.getInput(path.resolve(this.buildState.dir, match[1]))
      if (this.buildState.options.outputDirectory) {
        await this.getInput(path.resolve(this.buildState.dir, this.buildState.options.outputDirectory, match[1]))
      }
    }
  }
}

export default class BibTeXFactory extends RuleFactory {
  async analyze (files: Array<File>) {
    for (const file: File of files) {
      if (file.type === 'BibTeXControlFile') {
        const auxPath = this.buildState.resolveOutputPath('.aux')
        const auxFile = await this.buildState.getFile(auxPath)
        if (auxFile) {
          const rule = new BibTeX(this.buildState, auxFile)
          await this.buildState.addRule(rule)
        }
      }
    }
  }
}
