/* @flow */

import path from 'path'
import fs from 'fs-promise'
import BuildState from './BuildState'
import Rule from './Rule'
import BuildStateConsumer from './BuildStateConsumer'
import File from './File'

export default class Builder extends BuildStateConsumer {
  ruleClasses: Array<Class<Rule>> = []

  static async create (filePath: string, options: Object = {}) {
    const buildState = await BuildState.create(filePath, options)
    const builder = new Builder(buildState)

    await builder.initialize()

    return builder
  }

  async initialize () {
    const ruleClassPath: string = path.join(__dirname, 'Rules')
    const entries: Array<string> = await fs.readdir(ruleClassPath)
    this.ruleClasses = entries.map(entry => require(path.join(ruleClassPath, entry)).default)
    this.ruleClasses.sort((x, y) => y.priority - x.priority)
  }

  async analyze () {
    while (true) {
      const files: Array<File> = Array.from(this.buildState.files.values()).filter(file => !file.analyzed)

      if (files.length === 0) return

      for (const file: File of files) {
        const jobNames = file.jobNames.size === 0 ? [undefined] : Array.from(file.jobNames.values())
        for (const jobName of jobNames) {
          for (const ruleClass: Class<Rule> of this.ruleClasses) {
            await ruleClass.analyze(this.buildState, file, jobName)
          }
        }
      }

      for (const file of files) {
        file.analyzed = true
      }
    }
  }

  async evaluate () {
    const rules: Array<Rule> = Array.from(this.buildState.rules.values()).filter(rule => rule.needsEvaluation)
    rules.sort((x, y) => y.constructor.priority - x.constructor.priority)

    for (const rule: Rule of rules) {
      const triggers = Array.from(rule.getTriggers()).map(file => file.normalizedFilePath).join(', ')
      const triggerText = triggers ? ` triggered by updates to ${triggers}` : ''
      console.log(`Evaluating rule ${rule.id}${triggerText}`)
      rule.timeStamp = new Date()
      rule.needsEvaluation = false
      await rule.evaluate()
      await rule.updateOutputs()
    }
  }

  async checkUpdates () {
    for (const file of this.buildState.files.values()) {
      file.hasTriggeredEvaluation = false
      if (file.hasBeenUpdated) {
        for (const rule of file.rules.values()) {
          if (!rule.timeStamp || rule.timeStamp < file.timeStamp) {
            rule.needsEvaluation = true
            file.hasTriggeredEvaluation = true
          }
        }
        file.hasBeenUpdated = false
      }
    }
  }

  async build () {
    let evaluationCount = 0

    if (this.options.outputDirectory) {
      await fs.ensureDir(path.resolve(this.rootPath, this.options.outputDirectory))
    }

    const jobNames = this.options.jobNames
    if (jobNames) {
      const file = await this.getFile(this.filePath)
      if (file) {
        if (Array.isArray(jobNames)) {
          for (const jobName of jobNames) {
            file.jobNames.add(jobName)
          }
        } else {
          for (const jobName in jobNames) {
            file.jobNames.add(jobName)
          }
        }
      }
    }

    await this.loadStateCache()

    while (evaluationCount < 100 && Array.from(this.buildState.files.values()).some(file => !file.analyzed) ||
      Array.from(this.buildState.rules.values()).some(rule => rule.needsEvaluation)) {
      await this.analyze()
      await this.evaluate()
      await this.checkUpdates()
      evaluationCount++
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
