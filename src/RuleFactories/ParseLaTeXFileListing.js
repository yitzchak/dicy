/* @flow */

import path from 'path'

import BuildState from '../BuildState'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class ParseLaTeXFileListing extends Rule {
  constructor (buildState: BuildState, jobName: ?string, ...parameters: Array<File>) {
    super(buildState, jobName, ...parameters)
    this.priority = 200
  }

  async evaluate () {
    let rootPath: string = ''
    const results = {
      INPUT: new Set(),
      OUTPUT: new Set()
    }

    await this.firstParameter.parse([{
      names: ['path'],
      patterns: [/^PWD (.*)$/],
      evaluate: (reference, groups) => {
        rootPath = groups.path
      }
    }, {
      names: ['type', 'path'],
      patterns: [/^(INPUT|OUTPUT) (.*)$/],
      evaluate: (reference, groups) => {
        results[groups.type].add(this.buildState.normalizePath(path.resolve(rootPath, groups.path)))
      }
    }])

    this.firstParameter.contents = {
      inputs: Array.from(results.INPUT),
      outputs: Array.from(results.OUTPUT)
    }
  }
}

export default class ParseLaTeXFileListingFactory extends RuleFactory {
  async analyze (file: File, jobName: ?string) {
    if (file.type === 'LaTeXFileListing') {
      const rule = new ParseLaTeXFileListing(this.buildState, jobName, file)
      await this.buildState.addRule(rule)
    }
  }
}
