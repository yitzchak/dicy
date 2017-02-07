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
  static commands: Set<Command> = new Set(['build', 'report'])
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Find preexisting log files.'

  async run () {
    const filePattern = this.resolvePath('.@(log|*lg)')
    await this.getFiles(await glob(filePattern))
    return true
  }
}
