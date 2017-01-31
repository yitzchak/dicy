/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Message } from '../types'

export default class ParseAsymptoteLog extends Rule {
  static fileTypes: Set<string> = new Set(['AsymptoteLog'])

  async initialize () {
    await this.getResolvedOutput(`.log-ParsedAsymptoteLog`)
  }

  async run () {
    const parsedFile = await this.getResolvedOutput(`.log-ParsedAsymptoteLog`)
    if (!parsedFile) return false
    const rootPath = this.options.outputDirectory
      ? path.resolve(this.rootPath, this.options.outputDirectory)
      : this.rootPath
    const messages: Array<Message> = []
    const inputs: Array<string> = []
    const outputs: Array<string> = []

    await this.firstParameter.parse([{
      names: ['filePath'],
      patterns: [/^Wrote (.*)$/],
      evaluate: (reference, groups) => {
        outputs.push(this.normalizePath(path.resolve(rootPath, groups.filePath)))
      }
    }, {
      names: ['type', 'filePath'],
      patterns: [/^(Including|Loading) \S+ from (.*)$/],
      evaluate: (reference, groups) => {
        inputs.push(this.normalizePath(path.resolve(rootPath, groups.filePath)))
      }
    }])

    parsedFile.value = { messages, inputs, outputs }

    return true
  }
}
