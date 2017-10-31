import * as _ from 'lodash'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import State from '../State'

import { Command, OptionsInterface, Phase } from '../types'

export default class CreateOutputTree extends Rule {
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Create directory tree for aux files when `outputDirectory` is set.'

  static async isApplicable (state: State, command: Command, phase: Phase, options: OptionsInterface, parameters: File[] = []): Promise<boolean> {
    return !!options.outputDirectory && options.outputDirectory !== '.'
  }

  async run () {
    const outputDirectories: string[] = _.uniq(this.options.jobNames.map(jobName => this.state.getJobOptions(jobName).outputDirectory || '.')
      .filter(outputDirectory => outputDirectory !== '.'))
    const directories = await this.globPath('**/*', {
      types: 'directories',
      ignorePattern: outputDirectories.map(outputDirectory => `${outputDirectory}/**`)
    })
    directories.push('.')

    await Promise.all(directories.map(directory => File.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory || '.', directory))))

    return true
  }
}
