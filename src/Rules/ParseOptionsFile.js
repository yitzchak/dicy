/* @flow */

import fs from 'fs-promise'
import yaml from 'js-yaml'

import Rule from '../Rule'

import type { Command } from '../types'

export default class ParseOptionsFile extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static description: string = 'Parses the YAML option file.'

  async run () {
    const input = await this.getResolvedInput(':name.yaml')
    const output = await this.getResolvedOutput(':name.yaml-ParsedYAML')

    if (!input || !output) return true

    // $FlowIgnore
    const contents = await fs.readFile(input.realFilePath, { encoding: 'utf-8' })
    output.value = yaml.safeLoad(contents)

    return true
  }
}
