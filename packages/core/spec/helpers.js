/* @flow */

import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import temp from 'temp'

import { DiCy, File, Rule } from '../src/main'
import type { Command, Event, Phase } from '../src/types'

export async function cloneFixtures () {
  const tempPath = fs.realpathSync(temp.mkdirSync('dicy'))
  let fixturesPath = path.resolve(__dirname, 'fixtures')
  await File.copy(fixturesPath, tempPath)
  return tempPath
}

function formatMessage (event: Event) {
  switch (event.type) {
    case 'command':
      return `  [${event.rule}] Executing command \`${event.command}\``
    case 'action':
      const triggerText = event.triggers.length === 0 ? '' : ` triggered by ${event.triggers.join(', ')}`
      return `  [${event.rule}] Evaluating ${event.action}${triggerText}`
    case 'log':
      const parts = []

      if (event.name) parts.push(`[${event.name}]`)
      if (event.category) parts.push(`${event.category}:`)
      parts.push(event.text)

      return `  ${parts.join(' ')}`
  }
}

function constructMessage (found: Array<Event>, missing: Array<Event>) {
  const lines = []
  if (found.length !== 0) {
    lines.push('Did not expect the following events:', ...found.map(formatMessage))
  }
  if (missing.length !== 0) {
    lines.push('Expected the following events:', ...missing.map(formatMessage))
  }
  return lines.join('\n')
}

function compareFilePaths (x: string, y: string): boolean {
  return path.normalize(x) === path.normalize(y) || ((path.isAbsolute(x) || path.isAbsolute(y)) && path.basename(x) === path.basename(y))
}

function stringCompare (x: string, y: string): boolean {
  return x.replace(/[/\\'"^]/g, '') === y.replace(/[/\\'"^]/g, '')
}

export function partitionMessages (received: Array<Event>, expected: Array<Event>) {
  let proper = []
  let improper = []
  let missing = _.uniqWith(expected, _.isEqual)

  for (const event of _.uniqWith(received, _.isEqual)) {
    let index = missing.findIndex(candidate =>
      _.isMatchWith(event, candidate, (x, y, key) => key === 'file'
        ? compareFilePaths(x, y)
        : ((typeof x === 'string' && typeof y === 'string')
          ? stringCompare(x, y)
          : undefined)))
    if (index === -1) {
      improper.push(event)
    } else {
      proper.push(event)
      missing.splice(index, 1)
    }
  }

  return { proper, improper, missing }
}

export const customMatchers = {
  toReceiveEvents (util: Object, customEqualityTesters: Object) {
    return {
      compare: function (received: Array<Event>, expected: Array<Event>) {
        const { proper, improper, missing } = partitionMessages(received, expected)

        const pass = improper.length === 0 && missing.length === 0
        const message = pass
          ? constructMessage(proper, [])
          : constructMessage(improper, missing)

        return { pass, message }
      }
    }
  }
}

export type ParameterDefinition = {
  filePath: string,
  value?: any
}

export type RuleDefinition = {
  RuleClass?: Class<Rule>,
  command?: Command,
  phase?: Phase,
  jobName?: string,
  filePath?: string,
  parameters?: Array<ParameterDefinition>,
  options?: Object,
  targets?: Array<string>
}

export async function initializeRule ({ RuleClass, command, phase, jobName, filePath = 'file-types/LaTeX_article.tex', parameters = [], options = {}, targets = [] }: RuleDefinition) {
  if (!RuleClass) throw new Error('Missing rule class in initializeRule.')

  options.ignoreUserOptions = true
  const realFilePath = path.resolve(__dirname, 'fixtures', filePath)
  const dicy = await DiCy.create(realFilePath, options)
  const files = []

  for (const target of targets) {
    dicy.addTarget(target)
  }

  for (const { filePath, value } of parameters) {
    const file = await dicy.getFile(filePath)
    if (file && value) file.value = value
    files.push(file)
  }

  if (!command) {
    command = RuleClass.commands.values().next().value || 'build'
  }

  if (!phase) {
    phase = RuleClass.phases.values().next().value || 'execute'
  }
  const jobOptions = dicy.state.getJobOptions(jobName)
  const rule = new RuleClass(dicy.state, command, phase, jobOptions, ...files)

  spyOn(rule, 'log')
  await rule.initialize()

  return { dicy, rule, options: jobOptions }
}
