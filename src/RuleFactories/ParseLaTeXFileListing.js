/* @flow */

import fs from 'fs-promise'
import path from 'path'
import File from '../File'
import Rule from '../Rule'
import RuleFactory from '../RuleFactory'

class ParseLaTeXFileListing extends Rule {
  async evaluate () {
    let latexRule: ?Rule
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
          const input = await this.buildState.getFile(path.resolve(rootPath, match[2]))
          if (input) {
            if (!latexRule && input.type === 'LaTeX') {
              latexRule = this.buildState.getRule('LaTeX', input)
            }
            if (latexRule) {
              latexRule.getInput(input.filePath)
            }
          }
          break
        case 'OUTPUT':
          const output = await this.buildState.getFile(path.resolve(rootPath, match[2]))
          if (output) {
            if (latexRule) {
              latexRule.getOutput(output.filePath)
            }
            await output.update()
          }
          break
      }
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
