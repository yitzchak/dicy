/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

import type { Message } from '../types'

class LaTeX extends Rule {
  async evaluate () {
    let runLatex = Array.from(this.getTriggers()).length === 0

    for (const file: File of this.getTriggers()) {
      switch (file.type) {
        case 'LaTeXFileListing':
          await this.updateDependencies(file)
          break
        case 'LaTeXLog':
          if (file.contents) {
            runLatex = runLatex || file.contents.some((message: Message) => message.text === 'Please rerun LaTeX')
          }
          break
        default:
          runLatex = true
      }
    }

    if (!runLatex) return

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `pdflatex ${args.join(' ')}`

      await childProcess.exec(command, options)
      for (const ext of ['.fls', '.log']) {
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
