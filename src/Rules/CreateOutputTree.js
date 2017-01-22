/* @flow */

import fs from 'fs-promise'
import path from 'path'

import Rule from '../Rule'

import type { EvaluationTrigger, Phase } from '../types'

export default class CreateOutputTree extends Rule {
  static phases: Set<Phase> = new Set(['initialize'])
  static evaluationTrigger: EvaluationTrigger = 'always'

  async evaluate () {
    if (this.options.outputDirectory) {
      await fs.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory))
    }
    return true
  }
}
