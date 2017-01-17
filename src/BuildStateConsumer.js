/* @flow */

import path from 'path'

import BuildState from './BuildState'
import File from './File'

export default class BuildStateConsumer {
  buildState: BuildState
  options: Object
  jobName: ?string

  constructor (buildState: BuildState, jobName: ?string) {
    this.jobName = jobName
    this.buildState = buildState
    this.options = new Proxy(buildState.options, {
      get (target, key) {
        if (jobName) {
          if (key === 'jobName') return jobName
          if (typeof target.jobNames === 'object') {
            const jobOptions = target.jobNames[jobName]
            return key in jobOptions ? jobOptions[key] : target[key]
          }
        }
        return target[key]
      }
    })
  }

  normalizePath (filePath: string) {
    return this.buildState.normalizePath(filePath)
  }

  resolveOutputPath (ext: string) {
    let dir = this.buildState.dir
    let { name } = path.parse(this.buildState.filePath)

    if (this.options.jobName) {
      name = this.options.jobName
    }

    if (this.options.outputDirectory) {
      dir = path.resolve(dir, this.options.outputDirectory)
    }

    return path.format({ dir, name, ext })
  }

  async getFile (filePath: string): Promise<?File> {
    const file: ?File = await this.buildState.getFile(filePath)
    if (file && this.jobName) file.jobNames.add(this.jobName)
  }
}
