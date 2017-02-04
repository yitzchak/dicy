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
        const actualFound = []
        const actualMissing = []
        const expectedMissing = []
        const expectedFound = []

        for (let i = 0, j = 0; i < actual.length; i++) {
          let found = false
          for (; j < expected.length; j++) {
            if (_.isMatchWith(actual[i], expected[j], (objValue, srcValue, key) => key === 'file' ? true : undefined)) {
              actualFound.push(actual[i])
              expectedFound.push(expected[j])
              found = true
              break
            } else {
              expected.push(expected[j])
            }
          }
          if (!found) actualMissing.push(actual[i])
        }

        const pass = actualMissing.length === 0 && expectedMissing.length === 0
        const message = pass
          ? constructMessage(actualFound, expectedMissing)
          : constructMessage(actualMissing, [])

        return { pass, message }
      }
    }
  }
}
