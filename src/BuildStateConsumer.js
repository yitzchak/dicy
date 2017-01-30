/* @flow */

import BuildState from './BuildState'
import File from './File'
import Rule from './Rule'

import type { Message } from './types'

export default class BuildStateConsumer {
  buildState: BuildState
  options: Object
  jobName: ?string

  constructor (buildState: BuildState, jobName: ?string) {
    this.jobName = jobName
    this.buildState = buildState
    this.options = new Proxy(buildState.options, {
      get (target, key) {
        if (key === 'jobNames') {
          if ('jobName' in target) return [target.jobName]
          if ('jobNames' in target) return target.jobNames
          if ('jobs' in target) return Object.keys(target.jobs)
          return []
        } else if (jobName) {
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
    return this.buildState.resolveOutputPath(ext, this.jobName, this.options.outputDirectory)
  }

  async getFile (filePath: string): Promise<?File> {
    const file: ?File = await this.buildState.getFile(filePath)
    if (file && this.jobName) file.jobNames.add(this.jobName)
    return file
  }

  error (text: string) {
    this.log({ severity: 'error', text })
  }

  warning (text: string) {
    this.log({ severity: 'warning', text })
  }

  info (text: string) {
    this.log({ severity: 'info', text })
  }

  trace (text: string) {
    this.log({ severity: 'trace', text })
  }

  log (message: Message) {
    const severity = this.options.severity || 'warning'
    if ((severity === 'info' && message.severity === 'trace') ||
      (severity === 'warning' && (message.severity === 'trace' || message.severity === 'info')) ||
      (severity === 'error' && message.severity !== 'error')) return
    this.buildState.log(message)
  }

  getDistance (x: Rule, y: Rule): ?number {
    return this.buildState.getDistance(x, y)
  }
}
