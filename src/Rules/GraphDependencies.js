/* @flow */

import _ from 'lodash'
import fs from 'fs-promise'
// import path from 'path'

import BuildState from '../BuildState'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

const COMMAND_PHASE_JOB_NAME_PATTERN = /\(([^;)]*);([^;)]*);([^;)]*);?/

function getParameters (rule) {
  const [, command, phase, jobName] = rule.id ? rule.id.match(COMMAND_PHASE_JOB_NAME_PATTERN) || ['', '', '', ''] : ['', '', '', '']
  return { command, phase, jobName }
}

export default class GraphDependencies extends Rule {
  static commands: Set<Command> = new Set(['build', 'graph'])
  static phases: Set<Phase> = new Set(['finalize'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Creates a GraphViz dependency graph.'

  static async appliesToPhase (buildState: BuildState, jobName: ?string): Promise<boolean> {
    return (buildState.command === 'graph' || buildState.options.graphDependencies) &&
      await super.appliesToPhase(buildState, jobName)
  }

  async run () {
    let lines = []
    const rulesByCommand = _.groupBy(Array.from(this.buildState.rules.values()), rule => getParameters(rule).command)
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
      const rulesByPhase = _.groupBy(rulesByCommand[command], rule => getParameters(rule).phase)
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
        const rulesByJobName = _.groupBy(rulesByPhase[phase], rule => getParameters(rule).jobName)
        for (const jobName in rulesByJobName) {
          if (jobName) {
            startGraph(`${command};${phase};${jobName}`, `\\"${jobName}\\" job`)
          }
          const rules = rulesByJobName[jobName]
          for (let i = 0; i < rules.length; i++) {
            // let connected = false
            for (let j = 0; j < rules.length; j++) {
              const from = this.isChild(rules[i], rules[j])
              const to = this.isChild(rules[j], rules[i])

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
          if (jobName) endGraph()
        }
        endGraph()
      }
      endGraph()
    }

    endGraph()

    const filePath = this.resolvePath('-graph.dot')
    await fs.writeFile(filePath, lines.join('\n'))
    await this.getOutput(filePath)

    return true
  }
}
