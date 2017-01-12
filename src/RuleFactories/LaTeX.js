/* @flow */

import childProcess from 'mz/child_process'
import fs from 'mz/fs'
import path from 'path'
import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class LaTeX extends Rule {
  filePath: string

  constructor (buildState: BuildState, filePath: string) {
    super(buildState)
    this.filePath = filePath
    this.getInputFile(filePath)
  }

  async evaluate () {
    try {
      const args = this.contructArguments()
      await childProcess.exec(`pdflatex ${args.join(' ')}`)
      await this.parseRecorderOutput()
    } catch (error) {
      console.log(error)
    }
  }

  contructArguments () {
    const args = [
      '-interaction=batchmode',
      '-recorder'
    ]

    if (this.buildState.options.outputDirectory) {
      args.push(`-output-directory="${this.buildState.options.outputDirectory}"`)
    }

    args.push(`"${this.filePath}"`)

    return args
  }

  async parseRecorderOutput () {
    const flsPath = this.buildState.resolveOutputPath('.fls')
    const contents = await fs.readFile(flsPath, { encoding: 'utf-8' })
    const filePattern = /^(INPUT|OUTPUT|PWD) (.*)$/gm
    let match
    let rootPath: string = ''

    while ((match = filePattern.exec(contents)) !== null) {
      switch (match[1]) {
        case 'PWD':
          rootPath = match[2]
          break
        case 'INPUT':
          await this.getInputFile(path.resolve(rootPath, match[2]))
          break
        case 'OUTPUT':
          const outputFile = await this.getOutputFile(path.resolve(rootPath, match[2]))
          await outputFile.update()
          break
      }
    }
  }
}

export default class LaTeXFactory extends RuleFactory {
  async analyze (files: Array<File>) {
    for (const file: File of files) {
      if (file.type === 'LaTeX') {
        this.buildState.addRule(new LaTeX(this.buildState, file.filePath))
      }
    }
  }
}
