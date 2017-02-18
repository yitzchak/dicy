/* @flow */

import fs from 'fs-promise'
import path from 'path'
import yaml from 'js-yaml'

import BuildState from './BuildState'
import BuildStateConsumer from './BuildStateConsumer'
import File from './File'
import Rule from './Rule'

import type { Action, Command, Option, Phase, RuleInfo } from './types'

export default class Builder extends BuildStateConsumer {
  static async create (filePath: string, options: Object = {}) {
    const schema = await Builder.getOptionDefinitions()
    const buildState = await BuildState.create(filePath, options, schema)
    const builder = new Builder(buildState)

    await builder.initialize()

    return builder
  }

  async initialize () {
    const ruleClassPath: string = path.join(__dirname, 'Rules')
    const entries: Array<string> = await fs.readdir(ruleClassPath)
    this.buildState.ruleClasses = entries
      .map(entry => require(path.join(ruleClassPath, entry)).default)
  }

  async analyzePhase (command: Command, phase: Phase) {
    for (const ruleClass: Class<Rule> of this.ruleClasses) {
      const jobNames = ruleClass.ignoreJobName ? [undefined] : this.options.jobNames
      for (const jobName of jobNames) {
        const rule = await ruleClass.analyzePhase(this.buildState, command, phase, jobName)
        if (rule) {
          await this.addRule(rule)
        }
      }
    }
  }

  async analyzeFiles (command: Command, phase: Phase) {
    while (true) {
      const file: ?File = Array.from(this.files).find(file => !file.analyzed)

      if (!file) break

      for (const ruleClass: Class<Rule> of this.ruleClasses) {
        const jobNames = file.jobNames.size === 0 ? [undefined] : Array.from(file.jobNames.values())
        for (const jobName of jobNames) {
          const rule = await ruleClass.analyzeFile(this.buildState, command, phase, jobName, file)
          if (rule) {
            await this.addRule(rule)
          }
        }
      }

      file.analyzed = true
    }

    this.calculateDistances()
  }

  getAvailableRules (command: ?Command): Array<RuleInfo> {
    return this.ruleClasses
      .filter(rule => !command || rule.commands.has(command))
      .map(rule => ({ name: rule.name, description: rule.description }))
  }

  async evaluateRule (rule: Rule, action: Action) {
    if (rule.success) {
      await rule.evaluate(action)
    } else {
      this.info(`Skipping rule ${rule.id} because of previous failure.`)
    }
  }

  async evaluate (command: Command, phase: Phase, action: Action) {
    const rules: Array<Rule> = Array.from(this.rules).filter(rule => rule.needsEvaluation && rule.constructor.phases.has(phase))
    const ruleGroups: Array<Array<Rule>> = []

    for (const rule of rules) {
      let notUsed = true
      for (const ruleGroup of ruleGroups) {
        if (this.isConnected(ruleGroup[0], rule)) {
          ruleGroup.push(rule)
          notUsed = false
          break
        }
      }
      if (notUsed) ruleGroups.push([rule])
    }

    for (const ruleGroup of ruleGroups) {
      let candidateRules = []
      let dependents = []
      let minimumCount = Number.MAX_SAFE_INTEGER

      for (const x of ruleGroup) {
        const inputCount = ruleGroup.reduce((count, y) => this.isChild(y, x) ? count + 1 : count, 0)
        if (inputCount === 0) {
          candidateRules.push(x)
        } else if (inputCount === minimumCount) {
          dependents.push(x)
        } else if (inputCount < minimumCount) {
          dependents = [x]
          minimumCount = inputCount
        }
      }

      if (candidateRules.length === 0) {
        candidateRules = dependents
      }

      candidateRules.sort((x, y) => x.inputs.size - y.inputs.size)

      for (const rule of candidateRules) {
        await this.checkUpdates(command, phase)
        await this.evaluateRule(rule, action)
      }
    }

    await this.checkUpdates(command, phase)
  }

  async checkUpdates (command: Command, phase: Phase) {
    for (const file of this.files) {
      for (const rule of file.rules.values()) {
        await rule.addFileActions(file, command, phase)
      }
      file.hasBeenUpdated = false
    }
  }

  async run (...commands: Array<Command>): Promise<boolean> {
    for (const command of commands) {
      for (const phase: Phase of ['initialize', 'execute', 'finalize']) {
        await this.runPhase(command, phase)
      }
    }

    return Array.from(this.rules).every(rule => rule.success)
  }

  async runPhase (command: Command, phase: Phase): Promise<void> {
    for (const file of this.files) {
      file.hasBeenUpdated = file.hasBeenUpdatedCache
      file.analyzed = false
    }

    await this.analyzePhase(command, phase)

    for (let cycle = 0; cycle < this.options.phaseCycles; cycle++) {
      for (const action of ['updateDependencies', 'run']) {
        await this.analyzeFiles(command, phase)
        await this.evaluate(command, phase, action)
      }
      if (Array.from(this.files).every(file => file.analyzed) &&
        Array.from(this.rules).every(rule => !rule.needsEvaluation)) break
    }
  }

  static async getOptionDefinitions (): Promise<{ [name: string]: Option }> {
    const contents = await fs.readFile(path.resolve(__dirname, '..', 'resources', 'option-schema.yaml'), { encoding: 'utf-8' })
    return yaml.load(contents)
  }
}
