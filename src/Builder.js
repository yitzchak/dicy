/* @flow */

import path from 'path'
import fs from 'fs-promise'
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
    for (const rule: Rule of this.buildState.rules.values()) {
      if (rule.needsEvaluation) {
        console.log(`Evaluating rule ${rule.id}`)
        rule.timeStamp = new Date()
        rule.needsEvaluation = false
        await rule.evaluate()
      }
    }
  }

  async checkUpdates () {
    for (const file of this.buildState.files.values()) {
      if (file.hasBeenUpdated) {
        for (const rule of file.rules.values()) {
          if (!rule.timeStamp || rule.timeStamp < file.timeStamp) {
            console.log(`Evaluation of ${rule.id} trigged by updates to ${file.normalizedFilePath}`)
            rule.needsEvaluation = true
          }
        }
        file.hasBeenUpdated = false
      }
    }
  }

  async build () {
    if (this.buildState.options.outputDirectory) {
      await fs.ensureDir(path.resolve(this.buildState.dir, this.buildState.options.outputDirectory))
    }

    await this.loadStateCache()

    while (Array.from(this.buildState.files.values()).some(file => !file.analyzed) ||
      Array.from(this.buildState.rules.values()).some(rule => rule.needsEvaluation)) {
      await this.analyze()
      await this.evaluate()
      await this.checkUpdates()
    }

    await this.saveStateCache()
  }

  async loadStateCache () {
    await this.buildState.loadCache()
  }

  async saveStateCache () {
    await this.buildState.saveCache()
  }
}
