/* @flow */

import fs from 'fs-promise'
import path from 'path'
import yaml from 'js-yaml'

import BuildState from './BuildState'
import BuildStateConsumer from './BuildStateConsumer'
import File from './File'
import Rule from './Rule'

import type { Command, Log, Message, Option, Phase } from './types'

export default class Builder extends BuildStateConsumer {
  ruleClasses: Array<Class<Rule>> = []

  static async create (filePath: string, options: Object = {}, log: Log = (message: Message): void => {}) {
    const schema = await Builder.getOptionDefinitions()
    const buildState = await BuildState.create(filePath, options, schema, log)
    const builder = new Builder(buildState)

    await builder.initialize()

    return builder
  }

  async initialize () {
    const ruleClassPath: string = path.join(__dirname, 'Rules')
    const entries: Array<string> = await fs.readdir(ruleClassPath)
    this.ruleClasses = entries.map(entry => require(path.join(ruleClassPath, entry)).default)
  }

  async phaseAnalyze () {
    for (const ruleClass: Class<Rule> of this.ruleClasses) {
      const rule = await ruleClass.phaseAnalyze(this.buildState, undefined)
      if (rule) {
        await this.buildState.addRule(rule)
      }
    }
  }

  async analyze () {
    while (true) {
      const files: Array<File> = Array.from(this.buildState.files.values()).filter(file => !file.analyzed)

      if (files.length === 0) break

      const file = files[0]

      for (const ruleClass: Class<Rule> of this.ruleClasses) {
        const jobNames = file.jobNames.size === 0 ? [undefined] : Array.from(file.jobNames.values())
        for (const jobName of jobNames) {
          const rule = await ruleClass.analyze(this.buildState, jobName, file)
          if (rule) {
            await this.buildState.addRule(rule)
            file.hasTriggeredEvaluation = true
          }
        }
      }

      file.analyzed = true
    }

    this.buildState.calculateDistances()
  }

  async evaluateRule (rule: Rule) {
    if (rule.success) {
      const triggers = Array.from(rule.getTriggers()).map(file => file.normalizedFilePath).join(', ')
      const triggerText = triggers ? ` triggered by updates to ${triggers}` : ''
      this.trace(`Evaluating rule ${rule.id}${triggerText}`)
      rule.timeStamp = new Date()
      rule.needsEvaluation = false
      rule.success = await rule.evaluate()
      await rule.updateOutputs()
    } else {
      this.info(`Skipping rule ${rule.id} because of previous failure.`)
    }
  }

  async evaluate () {
    const rules: Array<Rule> = Array.from(this.buildState.rules.values()).filter(rule => rule.needsEvaluation)
    const ruleGroups: Array<Array<Rule>> = []

    for (const rule of rules) {
      let notUsed = true
      for (const ruleGroup of ruleGroups) {
        if (this.buildState.distances.has(`${ruleGroup[0].id} ${rule.id}`) || this.buildState.distances.has(`${rule.id} ${ruleGroup[0].id}`)) {
          ruleGroup.push(rule)
          notUsed = false
          break
        }
      }
      if (notUsed) ruleGroups.push([rule])
    }

    for (const ruleGroup of ruleGroups) {
      ruleGroup.sort((x: Rule, y: Rule) => {
        const xy: ?number = this.buildState.distances.get(`${x.id} ${y.id}`)
        const yx: ?number = this.buildState.distances.get(`${y.id} ${x.id}`)
        if (typeof xy === 'number' && typeof yx === 'number') return xy - yx
        if (xy === yx) return 0
        return typeof xy === 'number' ? -1 : 1
      })
    }

    for (const ruleGroup of ruleGroups) {
      for (const rule of ruleGroup) {
        if (!rule.constructor.exclusive) await this.evaluateRule(rule)
      }
    }

    for (const ruleGroup of ruleGroups) {
      for (const rule of ruleGroup) {
        if (rule.constructor.exclusive) await this.evaluateRule(rule)
      }
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

  async run (command: Command): Promise<boolean> {
    this.buildState.command = command

    for (const phase: Phase of ['configure', 'initialize', 'execute', 'finalize']) {
      this.buildState.phase = phase
      for (const file of this.buildState.files.values()) {
        file.analyzed = false
      }
      let evaluationCount = 0

      await this.phaseAnalyze()

      while (evaluationCount < 100 && (Array.from(this.buildState.files.values()).some(file => !file.analyzed) ||
        Array.from(this.buildState.rules.values()).some(rule => rule.needsEvaluation))) {
        await this.analyze()
        await this.evaluate()
        await this.checkUpdates()
        evaluationCount++
      }
    }

    if (command === 'build') await this.saveStateCache()

    return Array.from(this.buildState.rules.values()).every(rule => rule.success)
  }

  async loadStateCache () {
    await this.buildState.loadCache()
  }

  async saveStateCache () {
    await this.buildState.saveCache()
  }

  static async getOptionDefinitions (): Promise<{ [name: string]: Option }> {
    const contents = await fs.readFile(path.resolve(__dirname, '..', 'resources', 'option-schema.yaml'), { encoding: 'utf-8' })
    return yaml.load(contents)
  }
}
