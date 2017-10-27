/* @flow */

import _ from 'lodash'

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

const COMMAND_PHASE_JOB_NAME_PATTERN = /\(([^;)]*);([^;)]*);([^;)]*);?/

export default class GraphDependencies extends Rule {
  static commands: Set<Command> = new Set(['graph'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Creates a GraphViz dependency graph.'

  async run () {
    let lines = []
    const rulesByCommand = _.groupBy(Array.from(this.state.rules.values()), rule => rule.command)
    let level = 0

    function addLine (line) {
      lines.push(_.repeat(' ', 2 * level) + line)
    }

    function startGraph (name, label) {
      if (name && label) {
        addLine(`subgraph "cluster_${name}" {`)
        level++
        addLine(`label = "${label}";`)
      } else {
        addLine('digraph {')
      }
    }

    function endGraph () {
      level--
      addLine('}')
    }

    startGraph()

    for (const command in rulesByCommand) {
      startGraph(command, `${command} command`)
      const rulesByPhase = _.groupBy(rulesByCommand[command], rule => rule.phase)
      for (const phase in rulesByPhase) {
        switch (phase) {
          case 'execute':
            addLine(`"cluster_${command};initialize" -> "cluster_${command};execute";`)
            break
          case 'finalize':
            addLine(`"cluster_${command};execute" -> "cluster_${command};finalize";`)
            break
        }
        startGraph(`${command};${phase}`, `${phase} phase`)
        const rulesByJobName = _.groupBy(rulesByPhase[phase], rule => rule.options.jobName)
        for (const jobName in rulesByJobName) {
          if (jobName !== 'undefined') {
            startGraph(`${command};${phase};${jobName}`, `\\"${jobName}\\" job`)
          }
          const rules = rulesByJobName[jobName] || []
          for (let i = 0; i < rules.length; i++) {
            // let connected = false
            for (let j = 0; j < rules.length; j++) {
              const from = this.isGrandparentOf(rules[i], rules[j])
              const to = this.isGrandparentOf(rules[j], rules[i])

              if (from) {
                if (!to) {
                  addLine(`"${rules[i].id}" -> "${rules[j].id}";`)
                } else if (i <= j) {
                  addLine(`"${rules[i].id}" -> "${rules[j].id}" [dir="both"];`)
                }
              }
            }
            addLine(`"${rules[i].id}" [shape=box,label="${rules[i].id.replace(COMMAND_PHASE_JOB_NAME_PATTERN, '(')}"];`)
          }
          if (jobName !== 'undefined') endGraph()
        }
        endGraph()
      }
      endGraph()
    }

    endGraph()

    const filePath = this.resolvePath('$NAME-graph.dot')
    await File.write(filePath, lines.join('\n'))
    await this.getOutput(filePath)

    return true
  }
}
