/* @flow */

import _ from 'lodash'
import fs from 'fs-promise'
import path from 'path'
import temp from 'temp'

import type { Message } from '../src/types'

export async function cloneFixtures () {
  const tempPath = await fs.realpath(temp.mkdirSync('ouroboros'))
  let fixturesPath = path.resolve(__dirname, 'fixtures')
  await fs.copy(fixturesPath, tempPath)
  return tempPath
}

function formatMessage (message: Message) {
  const parts = []

  if (message.name) parts.push(`[${message.name}]`)
  if (message.type) parts.push(`${message.type}:`)
  parts.push(message.text)

  return '  ' + parts.join(' ')
}

function constructMessage (found, missing) {
  const lines = []
  if (found.length !== 0) {
    lines.push('Did not expect the following messages:', ...found.map(formatMessage))
  }
  if (missing.length !== 0) {
    lines.push('Expected the following messages:', ...missing.map(formatMessage))
  }
  return lines.join('\n')
}

export const customMatchers = {
  toEqualMessages (util: Object, customEqualityTesters: Object) {
    return {
      compare: function (actual: Array<Message>, expected: Array<Message>) {
        const actualFlags: Array<Object> = actual.map(message => {
          return { message, found: false }
        })
        const expectedFlags: Array<Object> = expected.map(message => {
          return { message, found: false }
        })

        for (const actualFlag of actualFlags) {
          for (const expectedFlag of expectedFlags) {
            if (_.isMatch(actualFlag.message, expectedFlag.message)) {
              expectedFlag.found = true
              actualFlag.found = true
              break
            }
          }
        }

        const pass = actualFlags.every(flag => flag.found) && expectedFlags.every(flag => flag.found)
        const actualFound = actualFlags.filter(flag => flag.found).map(flag => flag.message)
        const actualMissing = actualFlags.filter(flag => !flag.found).map(flag => flag.message)
        const expectedMissing = expectedFlags.filter(flag => !flag.found).map(flag => flag.message)
        const message = pass
          ? constructMessage(actualFound, expectedMissing)
          : constructMessage(actualMissing, [])

        return { pass, message }
      }
    }
  }
}
