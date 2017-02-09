/* @flow */

import _ from 'lodash'
import fs from 'fs-promise'
import path from 'path'
import temp from 'temp'

import type { Event } from '../src/types'

export async function cloneFixtures () {
  const tempPath = await fs.realpath(temp.mkdirSync('ouroboros'))
  let fixturesPath = path.resolve(__dirname, 'fixtures')
  await fs.copy(fixturesPath, tempPath)
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
  return x === y || ((path.isAbsolute(x) || path.isAbsolute(y)) && path.basename(x) === path.basename(y))
}

function stringCompare (x: string, y: string): boolean {
  return x.replace(/[/\\'"]/, '') === y.replace(/[/\\'"]/, '')
}

export const customMatchers = {
  toReceiveEvents (util: Object, customEqualityTesters: Object) {
    return {
      compare: function (receivedEvents: Array<Event>, expectedEvents: Array<Event>) {
        let receivedFound = []
        let receivedMissing = []
        let expectedFound = []
        let expectedMissing = []
        let fromIndex = 0

        for (const received of receivedEvents) {
          let expectedIndex = _.findIndex(expectedEvents,
            expected => _.isMatchWith(received, expected, (x, y, key) => key === 'file'
              ? compareFilePaths(x, y)
              : ((typeof x === 'string' && typeof y === 'string')
                ? stringCompare(x, y)
                : undefined)),
            fromIndex)
          if (expectedIndex === -1) {
            receivedMissing.push(received)
          } else {
            receivedFound.push(received)
            expectedFound.push(expectedEvents[expectedIndex])
            expectedMissing = expectedMissing.concat(expectedEvents.slice(fromIndex, expectedIndex))
            fromIndex = expectedIndex + 1
          }
        }

        const pass = receivedMissing.length === 0 && expectedMissing.length === 0
        const message = pass
          ? constructMessage(receivedFound, expectedMissing)
          : constructMessage(receivedMissing, [])

        return { pass, message }
      }
    }
  }
}
