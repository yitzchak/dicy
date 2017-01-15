/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class LaTeX extends Rule {
  async evaluate () {
    let runLatex = true

    for (const file: File of this.getTriggers()) {
      if (file.type === 'LaTeX File Listing') {
        await this.updateDependencies(file)
      } else {
        runLatex = true
      }
    }

    if (!runLatex) return

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `pdflatex ${args.join(' ')}`

      await childProcess.exec(command, options)
      for (const ext of ['.fls']) {
        await this.getInput(this.buildState.resolveOutputPath(ext), false)
        await this.getOutput(this.buildState.resolveOutputPath(ext))
        // if (file) file.update()
      }

      for (const file: File of this.outputs.values()) {
        await file.update()
      }
    } catch (error) {
      console.log(error)
    }
  }

  async updateDependencies (file: File) {
    if (file.contents) {
      console.log(`Update LaTeX dependencies...`)
      await this.addInputs(file.contents.inputs)
      await this.addOutputs(file.contents.outputs)
    }
  }

  constructProcessOptions () {
    return {
      cwd: this.buildState.dir
    }
  }

  constructArguments () {
    const args = [
      '-interaction=batchmode',
      '-recorder'
    ]

    if (this.buildState.options.outputDirectory) {
      args.push(`-output-directory="${this.buildState.options.outputDirectory}"`)
    }

    if (this.buildState.options.jobName) {
      args.push(`-jobname="${this.buildState.options.jobName}"`)
    }

    args.push(`"${path.basename(this.firstParameter.filePath)}"`)

    return args
  }
}

export default class LaTeXFactory extends RuleFactory {
  async analyze (files: Array<File>) {
    for (const file: File of files) {
      if (file.type === 'LaTeX') {
        const rule = new LaTeX(this.buildState, file)
        await this.buildState.addRule(rule)
      }
    }
  }
}
