/* @flow */

import doGlob from 'glob'

import Rule from '../Rule'

import type { Command, Phase } from '../types'

function glob (pattern, options) {
  return new Promise((resolve, reject) => {
    doGlob(pattern, options, (error, files) => {
      if (error) return reject(error)
      resolve(files)
    })
  })
}

export default class FindLogFiles extends Rule {
  static commands: Set<Command> = new Set(['report'])
  static phases: Set<Phase> = new Set(['execute'])
  static alwaysEvaluate: boolean = true

  async run () {
    const filePattern = this.resolvePath('.@(log|*lg)')
    await this.getFiles(await glob(filePattern))
    return true
  }
}
