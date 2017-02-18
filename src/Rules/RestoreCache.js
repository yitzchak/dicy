/* @flow */

import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class RestoreCache extends Rule {
  static commands: Set<Command> = new Set(['clean', 'graph', 'report'])
  static phases: Set<Phase> = new Set(['initialize'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Restores file information from the cache for the clean, graph and report command.'

  async run () {
    if (this.buildState.cache) {
      if (this.buildState.cache.files) {
        for (const filePath in this.buildState.cache.files) {
          await this.getFile(filePath)
        }
      }
      if (this.buildState.cache.rules) {
        for (const id in this.buildState.cache.rules) {
          const [, name, parameterList] = id.match(/^([^(]*)([^)]*)$/) || []
          const [command, phase, jobName, ...filePaths] = (parameterList || '').split(';')
          const RuleClass = this.ruleClasses.find(ruleClass => ruleClass.name === name)
          if (RuleClass) {
            const files = this.getFiles(filePaths)
            // $FlowIgnore
            const rule = new RuleClass(this.buildState, command, phase, jobName, ...files)
            await rule.initialize()
            await this.addRule(rule)
          }
        }
      }
    }
    return true
  }
}
