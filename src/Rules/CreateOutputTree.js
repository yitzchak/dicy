/* @flow */

import fs from 'fs-promise'
import path from 'path'

import Rule from '../Rule'

import type { Phase } from '../types'

export default class CreateOutputTree extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true

  async run () {
    if (this.options.outputDirectory) {
      await fs.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory))
    }
    for (const jobName in this.options.jobs || {}) {
      if (this.options.jobs[jobName].outputDirectory) {
        await fs.ensureDir(path.resolve(this.rootPath, this.options.jobs[jobName].outputDirectory))
      }
    }
    return true
  }
}
