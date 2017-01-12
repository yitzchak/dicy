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

  static async create (filePath: string, options: Object = {}) {
    const buildState = await BuildState.create(filePath, options)
    const builder = new Builder(buildState)

    await builder.initialize()

    return builder
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
        console.log(`Evaluating rule ${rule.constructor.name}`)
        rule.timeStamp = new Date()
        rule.needsEvaluation = false
        await rule.evaluate()
      }
    }
  }

  async checkUpdates () {
    for (const file of this.buildState.files.values()) {
      if (file.hasBeenUpdated) {
        for (const rule of file.rules) {
          if (!rule.timeStamp || rule.timeStamp < file.timeStamp) {
            console.log(`${file.filePath} triggered evaluation of ${rule.constructor.name}`)
            rule.needsEvaluation = true
          }
        }
        file.hasBeenUpdated = false
      }
    }
  }

  async build () {
    let i = 0

    while (Array.from(this.buildState.files.values()).some(file => !file.analyzed) ||
      this.buildState.rules.some(rule => rule.needsEvaluation)) {
      await this.analyze()
      await this.evaluate()
      await this.checkUpdates()
      if (++i === 5) break
    }
  }

  async saveState () {
    await this.buildState.save()
  }
}
