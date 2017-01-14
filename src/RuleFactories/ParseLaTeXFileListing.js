/* @flow */

import fs from 'fs-promise'
import path from 'path'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class ParseLaTeXFileListing extends Rule {
  async evaluate () {
    const result = {
      inputs: [],
      outputs: []
    }
    const contents = await fs.readFile(this.firstParameter.filePath, { encoding: 'utf-8' })
    const filePattern = /^(INPUT|OUTPUT|PWD) (.*)$/gm
    let match
    let rootPath: string = ''

    while ((match = filePattern.exec(contents)) !== null) {
      switch (match[1]) {
        case 'PWD':
          rootPath = match[2]
          break
        case 'INPUT':
          result.inputs.push(this.buildState.normalizePath(path.resolve(rootPath, match[2])))
          break
        case 'OUTPUT':
          result.outputs.push(this.buildState.normalizePath(path.resolve(rootPath, match[2])))
          break
      }
    }

    const outputFile: ?File = await this.getOutput(`${this.firstParameter.normalizedFilePath}.parsed`, false)
    if (outputFile) {
      await outputFile.setContents(result)
    }
  }
}

export default class ParseLaTeXFileListingFactory extends RuleFactory {
  async analyze (files: Array<File>) {
    for (const file: File of files) {
      if (file.type === 'LaTeX File Listing') {
        const rule = new ParseLaTeXFileListing(this.buildState, file)
        await this.buildState.addRule(rule)
      }
    }
  }
}
