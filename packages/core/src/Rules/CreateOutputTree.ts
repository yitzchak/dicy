import * as _ from 'lodash'
import * as path from 'path'

import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase } from '../types'

export default class CreateOutputTree extends Rule {
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Create directory tree for aux files when `outputDirectory` is set.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return !!consumer.options.outputDirectory && consumer.options.outputDirectory !== '.'
  }

  async run () {
    const outputDirectories: string[] = _.uniq(this.options.jobNames.map(jobName => this.getJobOptions(jobName).outputDirectory || '.')
      .filter(outputDirectory => outputDirectory !== '.'))
    const directories = ['.'].concat(await this.globPath('**/*', {
      types: 'directories',
      ignorePattern: outputDirectories.map(outputDirectory => `${outputDirectory}/**`)
    }))

    await Promise.all(directories.map(directory => File.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory || '.', directory))))

    return true
  }
}
