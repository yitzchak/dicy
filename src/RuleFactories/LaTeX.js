/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class LaTeX extends Rule {
  async evaluate () {
    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `pdflatex ${args.join(' ')}`

      await childProcess.exec(command, options)
      for (const ext of ['.fls', '.log']) {
        const file = await this.getOutput(this.buildState.resolveOutputPath(ext))
        if (file) file.update()
      }
    } catch (error) {
      console.log(error)
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
