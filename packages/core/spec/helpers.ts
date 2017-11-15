/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import * as _ from 'lodash'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as temp from 'temp'

import { Command, Message } from '@dicy/types'

import Builder from '../src/Builder'
import File from '../src/File'
import Rule from '../src/Rule'
import { Phase } from '../src/types'

export async function cloneFixtures () {
  const tempPath = fs.realpathSync(temp.mkdirSync('dicy'))
  let fixturesPath = path.resolve(__dirname, 'fixtures')
  await File.copy(fixturesPath, tempPath)
  return tempPath
}

function formatMessage (event: Message) {
  const parts = []

  if (event.name) parts.push(`[${event.name}]`)
  if (event.category) parts.push(`${event.category}:`)
  parts.push(event.text)

  return `  ${parts.join(' ')}`
}

function constructMessage (found: Message[], missing: Message[]) {
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

export function partitionMessages (received: Message[], expected: Message[]) {
  let proper = []
  let improper = []
  let missing = _.uniqWith(expected, _.isEqual)

  for (const event of _.uniqWith(received, _.isEqual)) {
    let index = missing.findIndex(candidate =>
      _.isMatchWith(event, candidate, ((x: any, y: any, key: number | string | symbol): boolean | undefined => key === 'file'
        ? compareFilePaths(x, y)
        : ((typeof x === 'string' && typeof y === 'string')
          ? stringCompare(x, y)
          : undefined)) as _.isMatchCustomizer))
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
  toReceiveMessages (util: any, customEqualityTesters: any) {
    return {
      compare: function (received: Message[], expected: Message[]) {
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
  RuleClass?: typeof Rule,
  command?: Command,
  phase?: Phase,
  jobName?: string,
  filePath?: string,
  parameters?: Array<ParameterDefinition>,
  options?: any,
  targets?: Array<string>,
  clone?: boolean
}

export async function initializeRule ({ RuleClass, command, phase, jobName, filePath = 'file-types/LaTeX_article.tex', parameters = [], options = {}, targets = [], clone = false }: RuleDefinition) {
  if (!RuleClass) throw new Error('Missing rule class in initializeRule.')

  options.loadUserOptions = false
  const fixturesPath = clone ? await cloneFixtures() : path.resolve(__dirname, 'fixtures')
  const realFilePath = path.resolve(fixturesPath, filePath)
  const dicy = await Builder.create(realFilePath, options)
  const files: File[] = []

  for (const target of targets) {
    dicy.addTarget(target)
  }

  for (const { filePath, value } of parameters) {
    const file = await dicy.getFile(filePath)
    if (file) {
      if (value) file.value = value
      files.push(file)
    }
  }

  if (!command) {
    command = RuleClass.commands.values().next().value || 'build'
  }

  if (!phase) {
    phase = RuleClass.phases.values().next().value || 'execute'
  }
  const jobOptions = dicy.state.getJobOptions(jobName)
  const rule = new RuleClass(dicy.state, command, phase, jobOptions, files)

  spyOn(rule, 'log')
  await rule.initialize()

  return { dicy, rule, options: jobOptions }
}
