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

      const file = files[0]

      for (const ruleClass: Class<Rule> of this.ruleClasses) {
        const jobNames = file.jobNames.size === 0 ? [undefined] : Array.from(file.jobNames.values())
        for (const jobName of jobNames) {
          const rule = await ruleClass.analyze(this.buildState, jobName, file)
          if (rule) {
            await this.buildState.addRule(rule)
            if (rule.needsEvaluation) await this.evaluateRule(rule)
          }
        }
      }

      file.analyzed = true
    }
  }

  async evaluateRule (rule: Rule) {
    if (rule.success) {
      const triggers = Array.from(rule.getTriggers()).map(file => file.normalizedFilePath).join(', ')
      const triggerText = triggers ? ` triggered by updates to ${triggers}` : ''
      console.log(`Evaluating rule ${rule.id}${triggerText}`)
      rule.timeStamp = new Date()
      rule.needsEvaluation = false
      rule.success = await rule.evaluate()
      await rule.updateOutputs()
    } else {
      console.log(`Skipping rule ${rule.id} because of previous failure.`)
    }
  }

  async evaluate () {
    const rules: Array<Rule> = Array.from(this.buildState.rules.values()).filter(rule => rule.needsEvaluation)
    rules.sort((x, y) => y.constructor.priority - x.constructor.priority)

    for (const rule: Rule of rules) {
      await this.evaluateRule(rule)
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

  async build (): Promise<boolean> {
    if (!this.options.ignoreCache) await this.loadStateCache()

    for (const phase: string of ['initialize', 'execute', 'finalize']) {
      this.buildState.phase = phase
      for (const file of this.buildState.files.values()) {
        file.analyzed = false
      }
      let evaluationCount = 0

      if (phase === 'execute') {
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
      }

      while (evaluationCount < 100 && (Array.from(this.buildState.files.values()).some(file => !file.analyzed) ||
        Array.from(this.buildState.rules.values()).some(rule => rule.needsEvaluation))) {
        await this.analyze()
        await this.evaluate()
        await this.checkUpdates()
        evaluationCount++
      }
    }

    await this.saveStateCache()

    return Array.from(this.buildState.rules.values()).every(rule => rule.success)
  }

  async loadStateCache () {
    await this.buildState.loadCache()
  }

  async saveStateCache () {
    await this.buildState.saveCache()
  }
}
