/* @flow */

import fs from 'fs-promise'
import path from 'path'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class ParseLaTeXFileListing extends Rule {
  priority: 0

  async evaluate () {
    const results = {
      INPUT: new Set(),
      OUTPUT: new Set()
    }
    const contents = await fs.readFile(this.firstParameter.filePath, { encoding: 'utf-8' })
    const filePattern = /^(INPUT|OUTPUT|PWD) (.*)$/gm
    let match
    let rootPath: string = ''

    while ((match = filePattern.exec(contents)) !== null) {
      if (match[1] === 'PWD') {
        rootPath = match[2]
      } else {
        results[match[1]].add(this.buildState.normalizePath(path.resolve(rootPath, match[2])))
      }
    }

    this.firstParameter.contents = {
      inputs: Array.from(results.INPUT),
      outputs: Array.from(results.OUTPUT)
    }
  }
}

export default class ParseLaTeXFileListingFactory extends RuleFactory {
  async analyze (files: Array<File>) {
    for (const file: File of files) {
      if (file.type === 'LaTeXFileListing') {
        const rule = new ParseLaTeXFileListing(this.buildState, file)
        await this.buildState.addRule(rule)
      }
    }
  }
}
