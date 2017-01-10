/* @flow */

import path from 'path'
import fs from 'mz/fs'
import BuildState from './BuildState'
import Rule from './Rule'
import RuleFactory from './RuleFactory'

export default class Builder {
  buildState: BuildState
  ruleFactories: Array<RuleFactory> = []

  constructor (buildState: BuildState) {
    this.buildState = buildState
  }

  async initialize () {
    const ruleFactoryPath: string = path.join(__dirname, 'RuleFactories')
    const entries: Array<string> = await fs.readdir(ruleFactoryPath)
    this.ruleFactories = entries.map(entry => {
      const RuleFactoryImpl: Class<RuleFactory> = require(path.join(ruleFactoryPath, entry)).default
      return new RuleFactoryImpl(this.buildState)
    })
  }

  async analyze () {
    while (true) {
      const files = Array.from(this.buildState.files.values()).filter(file => !file.analyzed)

      if (files.length === 0) return

      for (const ruleFactory of this.ruleFactories) {
        await ruleFactory.analyze(files)
      }

      for (const file of files) {
        file.analyzed = true
      }
    }
  }

  async evaluate () {
    for (const rule: Rule of this.buildState.rules) {
      if (rule.needsEvaluation) {
        await rule.evaluate()
        rule.needsEvaluation = false
      }
    }
  }
}
