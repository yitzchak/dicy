/* @flow */

import fs from 'fs-promise'
// import path from 'path'

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class GraphDependencies extends Rule {
  static commands: Set<Command> = new Set(['build'])
  static phases: Set<Phase> = new Set(['finalize'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Creates a GraphViz dependency graph.'

  async run () {
    const lines = ['digraph {']
    const rules = Array.from(this.buildState.rules.values())

    for (let i = 0; i < rules.length; i++) {
      let connected = false
      for (let j = 0; j < rules.length; j++) {
        const from = this.getDistance(rules[i], rules[j]) === 1
        const to = this.getDistance(rules[j], rules[i]) === 1

        connected = connected || from || to

        if (from) {
          if (!to) {
            lines.push(`"${rules[i].constructor.name}" -> "${rules[j].constructor.name}";`)
          } else if (i <= j) {
            lines.push(`"${rules[i].constructor.name}" -> "${rules[j].constructor.name}" [dir="both"];`)
          }
        }
      }
      if (connected) lines.push(`"${rules[i].constructor.name}" [shape=box];`)

      // for (const input of rule.inputs.values()) {
      //   if (!path.isAbsolute(input.normalizedFilePath)) {
      //     lines.push(`"${input.normalizedFilePath}" -> "${rule.id}";`)
      //   }
      // }
      // for (const output of rule.outputs.values()) {
      //   if (!path.isAbsolute(output.normalizedFilePath)) {
      //     lines.push(`"${rule.id}" -> "${output.normalizedFilePath}";`)
      //   }
      // }
    }

    lines.push('}')

    await fs.writeFile(this.resolvePath('.dot'), lines.join('\n'))

    return true
  }
}
