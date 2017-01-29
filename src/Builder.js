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

  async analyzePhase () {
    for (const ruleClass: Class<Rule> of this.ruleClasses) {
      const rule = await ruleClass.analyzePhase(this.buildState, undefined)
      if (rule) {
        await this.buildState.addRule(rule)
      }
    }
  }

  async analyzeFiles () {
    while (true) {
      const file: ?File = Array.from(this.buildState.files.values()).find(file => !file.analyzed)

      if (!file) break

      for (const ruleClass: Class<Rule> of this.ruleClasses) {
        const jobNames = file.jobNames.size === 0 ? [undefined] : Array.from(file.jobNames.values())
        for (const jobName of jobNames) {
          const rule = await ruleClass.analyzeFile(this.buildState, jobName, file)
          if (rule) {
            await this.buildState.addRule(rule)
          }
        }
      }

      file.analyzed = true
    }

    this.buildState.calculateDistances()
  }

  async evaluateRule (rule: Rule) {
    if (true/*rule.success*/) {
      await rule.evaluate()
    } else {
      this.info(`Skipping rule ${rule.id} because of previous failure.`)
    }
  }

  async evaluate () {
    const rules: Array<Rule> = Array.from(this.buildState.rules.values()).filter(rule => rule.needsEvaluation && rule.constructor.phases.has(this.buildState.phase))
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
        const xx: number = this.getDistance(x, x) || Number.MAX_SAFE_INTEGER
        const yy: number = this.getDistance(y, y) || Number.MAX_SAFE_INTEGER
        const xy: ?number = this.getDistance(x, y)
        const yx: ?number = this.getDistance(y, x)
        if (xx === yy) {
          if (typeof xy === 'number' && typeof yx === 'number') return xy - yx
          if (xy === yx) return 0
          return typeof xy === 'number' ? -1 : 1
        } else {
          return yy - xx
        }
      })

      for (const rule of ruleGroup) {
        await this.checkUpdates()
        await this.evaluateRule(rule)
      }
    }

    await this.checkUpdates()
  }

  async checkUpdates () {
    for (const file of this.buildState.files.values()) {
      for (const rule of file.rules.values()) {
        await rule.addInputFileActions(file)
      }
      file.hasBeenUpdated = false
    }
  }

  async run (command: Command): Promise<boolean> {
    this.buildState.command = command
    const updatedFiles = Array.from(this.buildState.files.values()).filter(file => file.hasBeenUpdated)

    for (const phase: Phase of ['configure', 'initialize', 'execute', 'finalize']) {
      this.buildState.phase = phase
      for (const file of this.buildState.files.values()) {
        file.analyzed = false
      }
      for (const file of updatedFiles) {
        file.hasBeenUpdated = true
        for (const rule of file.rules.values()) {
          await rule.addInputFileActions(file)
        }
      }
      let evaluationCount = 0

      await this.analyzePhase()

      while (evaluationCount < 10 && (Array.from(this.buildState.files.values()).some(file => !file.analyzed) ||
        Array.from(this.buildState.rules.values()).some(rule => rule.needsEvaluation))) {
        await this.analyzeFiles()
        await this.evaluate()
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
