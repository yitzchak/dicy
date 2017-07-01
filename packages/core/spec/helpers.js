/* @flow */

import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import temp from 'temp'

import { File } from '../src/main'
import type { Event } from '../src/types'

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
  let missing = expected.slice(0)

  for (const event of received) {
    let index = _.findIndex(missing,
      candidate => _.isMatchWith(event, candidate, (x, y, key) => key === 'file'
        ? compareFilePaths(x, y)
        : ((typeof x === 'string' && typeof y === 'string')
          ? stringCompare(x, y)
          : undefined)),
      // $FlowIgnore
      0)
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
