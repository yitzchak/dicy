/* @flow */

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

export const customMatchers = {
  messagesToBe (util: Object, customEqualityTesters: Object) {
    return {
      compare: function (actual: Array<Message>, expected: Array<Message>) {
        const expectedMap: Map<Message, boolean> = new Map(expected.map(value => [value, false]))
        const result = {
          pass: true
        }

        for (const actualMessage: Message of actual) {

        }
        return result
      }
    }
  }
}
