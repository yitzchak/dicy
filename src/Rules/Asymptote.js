/* @flow */

import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Action } from '../types'

export default class Asymptote extends Rule {
  static fileTypes: Set<string> = new Set(['Asymptote'])
  static description: string = 'Run Asymptote on any generated .asy files.'

  async initialize () {
    await this.getExpandedInput(':dir/:name.log-ParsedAsymptoteLog', this.firstParameter)
  }

  async getFileActions (file: File): Promise<Array<Action>> {
    return [file.type === 'ParsedAsymptoteLog' ? 'updateDependencies' : 'run']
  }

  async updateDependencies (): Promise<boolean> {
    const files = this.actions.get('updateDependencies')

    if (files) {
      for (const file of files.values()) {
        if (file.value) {
          const { outputs } = file.value
          if (outputs) await this.getOutputs(outputs)
        }
      }
    }

    return true
  }

  constructCommand () {
    return [
      'asy',
      '-offscreen',
      '-vv',
      path.basename(this.firstParameter.normalizedFilePath)
    ]
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.options.outputDirectory
        ? path.resolve(this.rootPath, this.options.outputDirectory)
        : this.rootPath
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    const { dir, name } = path.parse(this.firstParameter.normalizedFilePath)
    for (const ext of ['_0.pdf', '_0.eps']) {
      await this.getOutput(path.format({ dir, name, ext }))
    }
    const output = await this.getResolvedOutput('.log-AsymptoteLog')
    if (output) output.value = `${stdout}\n${stderr}`
    return true
  }
}
