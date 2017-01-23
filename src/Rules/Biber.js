/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class Biber extends Rule {
  static fileTypes: Set<string> = new Set(['BiberControlFile'])

  async initialize () {
    await this.addResolvedInputs(['.log-ParsedLaTeXLog'])
  }

  async evaluate (): Promise<boolean> {
    const triggers = Array.from(this.getTriggers())
    const run: boolean = triggers.length === 0 ||
      triggers.some(file => file.type !== 'ParsedLaTeXLog' || (file.value && file.value.messages && file.value.messages.some(message => message.text.match(/run Biber/))))

    return !run || await this.execute()
  }

  constructCommand () {
    return `biber "${this.firstParameter.normalizedFilePath}"`
  }

  async parseOutput (stdout: string) {
    const databasePattern = /^Database file #\d+: (.*)$/mg
    let match

    while ((match = databasePattern.exec(stdout)) !== null) {
      await this.getInput(path.resolve(this.rootPath, match[1]))
      if (this.options.outputDirectory) {
        await this.getInput(path.resolve(this.rootPath, this.options.outputDirectory, match[1]))
      }
    }
  }
}
