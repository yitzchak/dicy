/* @flow */

import childProcess from 'mz/child_process'
import path from 'path'
import File from '../File'
import Rule from '../Rule'

import type { Message } from '../types'

export default class LaTeX extends Rule {
  static fileTypes: Set<string> = new Set(['LaTeX'])
  static priority: number = 0

  async evaluate () {
    let runLatex = Array.from(this.getTriggers()).length === 0

    for (const file: File of this.getTriggers()) {
      switch (file.type) {
        case 'LaTeXFileListing':
          await this.updateDependencies(file)
          break
        case 'LaTeXLog':
          if (file.contents) {
            runLatex = runLatex || file.contents.messages.some((message: Message) => message.text.match(/rerun LaTeX/))
            // for (const message: Message of file.contents.messages) {
            //   const match = message.text.match(/^... file '(.*)' not found$/)
            //   if (match) {
            //     console.log(match[1])
            //     this.getInput(path.resolve(path.dirname(file.filePath), match[1]), false)
            //   }
            // }
          }
          break
        default:
          runLatex = true
      }
    }

    if (!runLatex) return true

    console.log('Running LaTeX...')

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `pdflatex ${args.join(' ')}`

      await childProcess.exec(command, options)
      await this.addResolvedOutputs(['.fls', '.log'], true)

      for (const file: File of this.outputs.values()) {
        await file.update()
      }
    } catch (error) {
      console.log(error)
      return false
    }

    return true
  }

  async updateDependencies (file: File) {
    if (file.contents) {
      console.log(`Update LaTeX dependencies...`)
      if (file.contents && file.contents.inputs) await this.addInputs(file.contents.inputs)
      if (file.contents && file.contents.outputs) await this.addOutputs(file.contents.outputs)
    }
  }

  constructProcessOptions () {
    return {
      cwd: this.rootPath
    }
  }

  constructArguments () {
    const args = [
      '-interaction=batchmode',
      '-recorder'
    ]

    if (this.options.outputDirectory) {
      args.push(`-output-directory="${this.options.outputDirectory}"`)
    }

    if (this.options.jobName) {
      args.push(`-jobname="${this.options.jobName}"`)
    }

    args.push(`"${path.basename(this.firstParameter.filePath)}"`)

    return args
  }
}
