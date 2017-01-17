/* @flow */

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
          if (target.jobs) {
            const jobOptions = target.jobs[jobName]
            return (jobOptions && key in jobOptions) ? jobOptions[key] : target[key]
          }
        }
        return target[key]
      }
    })
  }

  get filePath (): string {
    return this.buildState.filePath
  }

  get rootPath (): string {
    return this.buildState.rootPath
  }

  normalizePath (filePath: string) {
    return this.buildState.normalizePath(filePath)
  }

  resolveOutputPath (ext: string) {
    return this.buildState.resolveOutputPath(ext, this.jobName)
  }

  async getFile (filePath: string): Promise<?File> {
    const file: ?File = await this.buildState.getFile(filePath)
    if (file && this.jobName) file.jobNames.add(this.jobName)
    return file
  }
}
