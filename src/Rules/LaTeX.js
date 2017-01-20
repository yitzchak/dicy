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
        case 'ParsedLaTeXFileListing':
          await this.updateDependencies(file)
          break
        case 'ParsedLaTeXLog':
          if (file.contents) {
            runLatex = runLatex || file.contents.messages.some((message: Message) => message.text.match(/(rerun LaTeX|Label(s) may have changed. Rerun)/))
          }
          break
        default:
          runLatex = true
      }
    }

    if (!runLatex) return true

    this.info('Running LaTeX...')

    try {
      const args = this.constructArguments()
      const options = this.constructProcessOptions()
      const command = `pdflatex ${args.join(' ')}`

      await childProcess.exec(command, options)
      await this.addResolvedInputs(['.fls-parsed', '.log-parsed'])
      await this.addResolvedOutputs(['.fls', '.log'])

      for (const file: File of this.outputs.values()) {
        await file.update()
      }
    } catch (error) {
      this.error(error)
      return false
    }

    return true
  }

  async updateDependencies (file: File) {
    if (file.contents) {
      this.info(`Update LaTeX dependencies...`)
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
