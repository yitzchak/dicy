/* @flow */

import path from 'path'

import Rule from '../Rule'

import type { Message } from '../types'

export default class ParseAsymptoteLog extends Rule {
  static parameterTypes: Array<Set<string>> = [new Set(['AsymptoteLog'])]
  static description: string = 'Parses the console output of Asymptote.'

  async run () {
    const output = await this.getResolvedOutput('$DIR/$NAME.log-ParsedAsymptoteLog', this.firstParameter)
    if (!output) return false

    let rootPath = this.rootPath
    const messages: Array<Message> = []
    const inputs: Array<string> = []
    const outputs: Array<string> = []

    await this.firstParameter.parse([{
      names: ['filePath'],
      patterns: [/^cd (.*)$/],
      evaluate: (references, groups) => {
        rootPath = groups.filePath
      }
    }, {
      names: ['filePath'],
      patterns: [/^Wrote (.*)$/],
      evaluate: (references, groups) => {
        outputs.push(this.normalizePath(path.resolve(rootPath, groups.filePath)))
      }
    }, {
      names: ['type', 'filePath'],
      patterns: [/^(Including|Loading) \S+ from (.*)$/],
      evaluate: (references, groups) => {
        if (!path.isAbsolute(groups.filePath)) {
          inputs.push(this.normalizePath(path.resolve(rootPath, groups.filePath)))
        }
      }
    }])

    output.value = { messages, inputs, outputs }

    return true
  }
}
